import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import ffmpegPathValue from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { lintAdvancedVideoQuality, readMotionPlan, type AdvancedQualityLint, type MotionPlan, type NormalizedBounds } from '../advanced/motion-plan.js';
import { renderAdvancedProject } from '../advanced/engine.js';
import { runCommand } from '../utils/process.js';

export interface VideoProbe {
  path: string;
  duration: number;
  size: number;
  width?: number;
  height?: number;
  fps?: number;
  videoCodec?: string;
  audioCodec?: string;
  hasAudioStream: boolean;
  audioIsSilent?: boolean;
  audioMaxVolumeDb?: number;
  /** True only when an audio stream contains signal above the silence threshold. */
  hasAudio: boolean;
}

function ratio(value?: string): number | undefined {
  if (!value) return undefined;
  const [numerator, denominator] = value.split('/').map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return undefined;
  return numerator / denominator;
}

function ffmpegTime(value: number): string {
  return Math.max(0, value).toFixed(6);
}

function safeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'frame';
}

function uniqueTimes(times: number[]): number[] {
  return [...new Set(times.map((time) => Number(time.toFixed(4))))].sort((a, b) => a - b);
}

function ffmpegBinary(): string {
  const ffmpegPath = ffmpegPathValue as unknown as string | null;
  if (!ffmpegPath) throw new Error('ffmpeg-static did not provide a binary for this platform');
  return ffmpegPath;
}

const audibleAudioThresholdDb = -60;

async function inspectAudioSignal(path: string): Promise<{
  hasAudio: boolean;
  audioIsSilent: boolean;
  audioMaxVolumeDb?: number;
}> {
  const result = await runCommand(ffmpegBinary(), [
    '-hide_banner', '-nostats', '-i', path,
    '-map', '0:a:0', '-vn',
    '-af', 'volumedetect',
    '-f', 'null', '-',
  ], {quiet: true});
  const output = `${result.stdout}\n${result.stderr}`;
  const match = output.match(/max_volume:\s*(-?inf|-?[0-9]+(?:\.[0-9]+)?)\s*dB/i);
  if (!match) return {hasAudio: true, audioIsSilent: false};
  if (match[1].toLowerCase().includes('inf')) return {hasAudio: false, audioIsSilent: true};
  const audioMaxVolumeDb = Number(match[1]);
  const audioIsSilent = !Number.isFinite(audioMaxVolumeDb) || audioMaxVolumeDb <= audibleAudioThresholdDb;
  return {hasAudio: !audioIsSilent, audioIsSilent, audioMaxVolumeDb};
}

export async function probeVideo(path: string): Promise<VideoProbe> {
  const absolutePath = resolve(path);
  const result = await runCommand(ffprobeStatic.path, [
    '-v', 'error',
    '-show_entries', 'format=duration,size:stream=index,codec_type,codec_name,width,height,r_frame_rate',
    '-of', 'json',
    absolutePath,
  ], { quiet: true });
  const payload = JSON.parse(result.stdout) as {
    format?: { duration?: string; size?: string };
    streams?: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number; r_frame_rate?: string }>;
  };
  const video = payload.streams?.find((stream) => stream.codec_type === 'video');
  const audio = payload.streams?.find((stream) => stream.codec_type === 'audio');
  const audioSignal = audio ? await inspectAudioSignal(absolutePath) : undefined;
  return {
    path: absolutePath,
    duration: Number(payload.format?.duration ?? 0),
    size: Number(payload.format?.size ?? 0),
    width: video?.width,
    height: video?.height,
    fps: ratio(video?.r_frame_rate),
    videoCodec: video?.codec_name,
    audioCodec: audio?.codec_name,
    hasAudioStream: Boolean(audio),
    audioIsSilent: audioSignal?.audioIsSilent,
    audioMaxVolumeDb: audioSignal?.audioMaxVolumeDb,
    hasAudio: audioSignal?.hasAudio ?? false,
  };
}

async function extractFrame(videoPath: string, output: string, time: number, additionalFilter?: string): Promise<string> {
  await mkdir(dirname(output), { recursive: true });
  const filters = [`trim=start=${ffmpegTime(time)}`, 'setpts=PTS-STARTPTS'];
  if (additionalFilter) filters.push(additionalFilter);
  await runCommand(ffmpegBinary(), [
    '-y', '-filter_threads', '1', '-i', resolve(videoPath),
    '-vf', filters.join(','),
    '-frames:v', '1', output,
  ], { quiet: true });
  return output;
}

export async function extractReviewFrames(videoPath: string, outputDir: string, times: number[]): Promise<string[]> {
  const absoluteOutput = resolve(outputDir);
  await mkdir(absoluteOutput, { recursive: true });
  const outputs: string[] = [];
  for (let index = 0; index < times.length; index += 1) {
    const output = join(absoluteOutput, `review-${String(index + 1).padStart(2, '0')}-${times[index].toFixed(3)}s.png`);
    outputs.push(await extractFrame(videoPath, output, times[index]));
  }
  return outputs;
}

export interface VisualReviewOptions {
  overviewInterval?: number;
  transitionTimes?: number[];
  transitionWindow?: number;
  transitionFps?: number;
  /** Enables source lint, motion-plan review moments, and the layout audit render. */
  projectFile?: string;
  motionPlanPath?: string;
  /** Original project variables, forwarded to the isolated layout audit render. */
  reviewRenderVariables?: Record<string, unknown>;
  layoutAuditFps?: number;
  maxLayoutEvidence?: number;
}

export interface LayoutEvidence {
  start: number;
  end: number;
  time: number;
  path: string;
  message: string;
}

export interface MotionContinuityCandidate {
  shotId: string;
  regionId: string;
  start: number;
  end: number;
  time: number;
  measuredMotion: number;
  baselineMotion: number;
  threshold: number;
  evidencePath: string;
  message: string;
}

export interface MotionContinuityReport {
  analyzed: boolean;
  samplesPerSecond: number;
  candidates: MotionContinuityCandidate[];
  excludedIntentionalStillness: Array<{start: number; end: number; reason: string}>;
  interpretation: string;
}

export interface VisualReviewPack {
  video: VideoProbe;
  outputDir: string;
  overviewSheets: string[];
  transitionSheets: string[];
  settledFrames: string[];
  anomalyCandidates: string[];
  sourceQuality?: AdvancedQualityLint;
  layoutAuditVideo?: string;
  layoutEvidenceFrames: LayoutEvidence[];
  motionContinuity?: MotionContinuityReport;
  evidenceFrames: string[];
  checklist: string[];
  manifestPath: string;
  deliveryBlockedUntil: string;
}

const visualChecklist = [
  'Inspect every exact evidence frame first; decide whether each marked overflow, overlap, centering delta, or motion lull is intentional.',
  'Inspect optical spacing between words, letters, logos, icons, and UI groups after every animation settles.',
  'Look for unintended tracking, collisions, clipping, overflow, orphaned words, and text that reads as disconnected labels.',
  'Compare frames immediately before, during, and after every transition for flashes, jumps, stale layers, or mismatched direction.',
  'Verify the focal subject, supporting layers, and camera preserve intentional momentum; ambient background pixels alone do not count as focal continuity.',
  'Verify camera scale, rotation, perspective, and motion blur preserve hierarchy and legibility.',
  'For portrait and square delivery, verify the scene was recomposed for the frame and all essential content remains inside the selected platform safe area.',
  'Verify caption plates enter only when copy needs support, never obscure the focal subject, and do not linger empty before or after speech.',
  'Inspect exact active-word, phrase-change, and settled-caption frames for timing, line-wrap, emphasis, safe-area, and speaker-label errors.',
  'If word timing was interpolated from cue timestamps, treat it as approximate and check perceived speech alignment instead of claiming exact synchronization.',
  'Verify cursor paths, click responses, card assembly, masks, particles, and UI states have a visible cause and clean result.',
  'Confirm the final CTA or intentional resolution is stable, readable, composed according to the art direction, and held long enough.',
  'Treat black, frozen, silent, or low-motion segments as review candidates, not automatic failures; decide from the declared direction.',
];

async function createContactSheet(options: {
  ffmpegPath: string;
  videoPath: string;
  outputPath: string;
  selectionFilter: string;
  columns: number;
  rows: number;
}): Promise<void> {
  const workingDirectory = await mkdtemp(join(dirname(options.outputPath), '.review-sheet-'));
  const framePattern = join(workingDirectory, 'frame-%03d.png');
  const capacity = options.columns * options.rows;
  try {
    await runCommand(options.ffmpegPath, [
      '-y', '-filter_threads', '1', '-i', options.videoPath,
      '-vf', options.selectionFilter,
      '-fps_mode', 'vfr', '-frames:v', String(capacity), framePattern,
    ], { quiet: true });
    await runCommand(options.ffmpegPath, [
      '-y', '-filter_threads', '1', '-framerate', '1', '-i', framePattern,
      '-vf', `scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2:color=black,tile=${options.columns}x${options.rows}`,
      '-frames:v', '1', options.outputPath,
    ], { quiet: true });
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}

function anomalyLines(stderr: string): string[] {
  return stderr
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /black_(start|end)|freeze_(start|end|duration)|silence_(start|end|duration)/.test(line));
}

function parseWhiteMarkerTimes(output: string): number[] {
  const times: number[] = [];
  for (const line of output.split('\n')) {
    const time = line.match(/\bt:\s*([0-9.]+)/);
    const black = line.match(/\bpblack:\s*([0-9.]+)/);
    if (time && black && Number(black[1]) >= 98) times.push(Number(time[1]));
  }
  return uniqueTimes(times);
}

function markerRuns(times: number[], samplesPerSecond: number): Array<{start: number; end: number}> {
  if (times.length === 0) return [];
  const runs: Array<{start: number; end: number}> = [];
  let start = times[0];
  let previous = times[0];
  const maximumGap = 1.6 / samplesPerSecond;
  for (const time of times.slice(1)) {
    if (time - previous > maximumGap) {
      runs.push({start, end: previous + 1 / samplesPerSecond});
      start = time;
    }
    previous = time;
  }
  runs.push({start, end: previous + 1 / samplesPerSecond});
  return runs;
}

function evidenceTimesForRuns(runs: Array<{start: number; end: number}>, maximum: number): Array<{start: number; end: number; time: number}> {
  const evidence: Array<{start: number; end: number; time: number}> = [];
  for (const run of runs) {
    const duration = run.end - run.start;
    if (duration <= 2) {
      evidence.push({...run, time: run.start + duration / 2});
    } else {
      for (let time = run.start + 0.35; time < run.end; time += 1.5) evidence.push({...run, time});
    }
  }
  return evidence.slice(0, maximum);
}

async function createLayoutAudit(
  projectFile: string,
  outputDir: string,
  variables: Record<string, unknown>,
  samplesPerSecond: number,
  maximumEvidence: number,
): Promise<{videoPath: string; evidence: LayoutEvidence[]}> {
  const videoPath = join(outputDir, 'layout-audit.mp4');
  await renderAdvancedProject({
    projectFile,
    output: videoPath,
    variables: {...variables, __AI_PROMO_REVIEW_OVERLAY__: true},
    workers: 1,
  });
  const markerAnalysis = await runCommand(ffmpegBinary(), [
    '-hide_banner', '-i', videoPath,
    '-vf', `fps=${samplesPerSecond},crop=24:24:4:4,negate,blackframe=amount=98:threshold=32`,
    '-an', '-f', 'null', '-',
  ], {quiet: true});
  const samples = parseWhiteMarkerTimes(`${markerAnalysis.stdout}\n${markerAnalysis.stderr}`);
  const moments = evidenceTimesForRuns(markerRuns(samples, samplesPerSecond), maximumEvidence);
  const evidence: LayoutEvidence[] = [];
  for (let index = 0; index < moments.length; index += 1) {
    const moment = moments[index];
    const path = join(outputDir, `layout-issue-${String(index + 1).padStart(2, '0')}-${moment.time.toFixed(3)}s.png`);
    await extractFrame(videoPath, path, moment.time);
    evidence.push({
      ...moment,
      path,
      message: 'The audit overlay marks exact registered bounds, constraints, collisions, center targets, element ids, and source labels. The host AI must decide whether the condition is intentional.',
    });
  }
  return {videoPath, evidence};
}

interface MotionSample {
  time: number;
  value: number;
}

function parseSignalStats(output: string, offset: number): MotionSample[] {
  const samples: MotionSample[] = [];
  let currentTime: number | undefined;
  for (const line of output.split('\n')) {
    const frame = line.match(/\bpts_time:([0-9.]+)/);
    if (frame) currentTime = Number(frame[1]) + offset;
    const average = line.match(/lavfi\.signalstats\.YAVG=([0-9.]+)/);
    if (average && currentTime !== undefined) samples.push({time: currentTime, value: Number(average[1])});
  }
  return samples;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function intervalContains(time: number, intervals: Array<{start: number; end: number}>): boolean {
  return intervals.some((interval) => time >= interval.start && time <= interval.end);
}

function lowMotionRuns(
  samples: MotionSample[],
  threshold: number,
  samplesPerSecond: number,
  excluded: Array<{start: number; end: number}>,
): Array<{start: number; end: number; time: number; measured: number}> {
  const low = samples.filter((sample, index) => index > 0 && sample.value <= threshold && !intervalContains(sample.time, excluded));
  if (low.length === 0) return [];
  const groups: MotionSample[][] = [[low[0]]];
  const maximumGap = 1.6 / samplesPerSecond;
  for (const sample of low.slice(1)) {
    const group = groups.at(-1)!;
    if (sample.time - group.at(-1)!.time <= maximumGap) group.push(sample);
    else groups.push([sample]);
  }
  return groups
    .filter((group) => group.length / samplesPerSecond >= 0.45)
    .map((group) => ({
      start: group[0].time,
      end: group.at(-1)!.time + 1 / samplesPerSecond,
      time: (group[0].time + group.at(-1)!.time) / 2,
      measured: median(group.map((sample) => sample.value)),
    }));
}

function regionCrop(bounds: NormalizedBounds, width: number, height: number): {x: number; y: number; width: number; height: number} {
  const x = Math.max(0, Math.floor(bounds.x * width));
  const y = Math.max(0, Math.floor(bounds.y * height));
  const cropWidth = Math.max(2, Math.min(width - x, Math.floor(bounds.width * width)));
  const cropHeight = Math.max(2, Math.min(height - y, Math.floor(bounds.height * height)));
  return {
    x: x - x % 2,
    y: y - y % 2,
    width: cropWidth - cropWidth % 2,
    height: cropHeight - cropHeight % 2,
  };
}

async function analyzeMotionContinuity(
  videoPath: string,
  outputDir: string,
  video: VideoProbe,
  plan: MotionPlan,
  samplesPerSecond = 6,
): Promise<MotionContinuityReport> {
  const candidates: MotionContinuityCandidate[] = [];
  const width = video.width ?? plan.format.width;
  const height = video.height ?? plan.format.height;
  const excluded = plan.intentionalStillness;
  const regions = new Map(plan.regions.map((region) => [region.id, region]));

  for (const shot of plan.shots) {
    if (shot.motionIntent === 'intentional-stillness' || shot.end <= shot.start) continue;
    const region = shot.subjectRegionId ? regions.get(shot.subjectRegionId) : undefined;
    if (region?.expectedMotion === 'intentional-stillness') continue;
    const bounds = region?.bounds ?? {x: 0, y: 0, width: 1, height: 1};
    const crop = regionCrop(bounds, width, height);
    const analysis = await runCommand(ffmpegBinary(), [
      '-hide_banner', '-filter_threads', '1', '-i', resolve(videoPath),
      '-vf', `trim=start=${ffmpegTime(shot.start)}:end=${ffmpegTime(Math.min(shot.end, video.duration))},setpts=PTS-STARTPTS,crop=${crop.width}:${crop.height}:${crop.x}:${crop.y},fps=${samplesPerSecond},tblend=all_mode=difference,signalstats,metadata=mode=print:file=-`,
      '-an', '-f', 'null', '-',
    ], {quiet: true});
    const samples = parseSignalStats(`${analysis.stdout}\n${analysis.stderr}`, shot.start);
    const meaningful = samples.slice(1).filter((sample) => !intervalContains(sample.time, excluded));
    const baseline = median(meaningful.map((sample) => sample.value));
    const threshold = Math.max(0.08, baseline * 0.2);
    const runs = lowMotionRuns(samples, threshold, samplesPerSecond, excluded);
    for (const run of runs) {
      const index = candidates.length;
      const evidencePath = join(outputDir, `motion-lull-${String(index + 1).padStart(2, '0')}-${run.time.toFixed(3)}s.png`);
      await extractFrame(
        videoPath,
        evidencePath,
        run.time,
        `drawbox=x=${crop.x}:y=${crop.y}:w=${crop.width}:h=${crop.height}:color=#ff3b5c@0.9:t=6`,
      );
      candidates.push({
        shotId: shot.id,
        regionId: region?.id ?? 'full-frame',
        start: run.start,
        end: run.end,
        time: run.time,
        measuredMotion: Number(run.measured.toFixed(4)),
        baselineMotion: Number(baseline.toFixed(4)),
        threshold: Number(threshold.toFixed(4)),
        evidencePath,
        message: 'Focal motion fell materially below this shot’s baseline. This is a review candidate, not an automatic failure; compare it with the declared motion intent.',
      });
    }
  }

  return {
    analyzed: true,
    samplesPerSecond,
    candidates,
    excludedIntentionalStillness: excluded,
    interpretation: 'Motion is measured inside the declared focal region. Low-motion runs are candidates for human/AI direction review, while declared intentional stillness is excluded.',
  };
}

async function extractSettledFrames(videoPath: string, outputDir: string, plan: MotionPlan, duration: number): Promise<string[]> {
  const moments = plan.reviewMoments.filter((moment) => moment.time <= duration);
  const outputs: string[] = [];
  for (let index = 0; index < moments.length; index += 1) {
    const moment = moments[index];
    const output = join(outputDir, `settled-${String(index + 1).padStart(2, '0')}-${safeName(moment.label)}-${moment.time.toFixed(3)}s.png`);
    outputs.push(await extractFrame(videoPath, output, moment.time));
  }
  return outputs;
}

export async function createVisualReviewPack(videoPath: string, outputDir: string, options: VisualReviewOptions = {}): Promise<VisualReviewPack> {
  const ffmpegPath = ffmpegBinary();
  const video = await probeVideo(videoPath);
  const absoluteVideo = resolve(videoPath);
  const absoluteOutput = resolve(outputDir);
  const interval = options.overviewInterval ?? 2;
  const transitionWindow = options.transitionWindow ?? 1;
  const transitionFps = options.transitionFps ?? 4;
  const layoutAuditFps = options.layoutAuditFps ?? 6;
  const maxLayoutEvidence = options.maxLayoutEvidence ?? 12;
  const sourceFps = video.fps && video.fps > 0 ? video.fps : 30;
  if (!(interval >= 0.25 && interval <= 10)) throw new Error('overviewInterval must be between 0.25 and 10 seconds');
  if (!(transitionWindow >= 0.25 && transitionWindow <= 3)) throw new Error('transitionWindow must be between 0.25 and 3 seconds');
  if (!(transitionFps >= 1 && transitionFps <= 12)) throw new Error('transitionFps must be between 1 and 12');
  if (!(layoutAuditFps >= 2 && layoutAuditFps <= 12)) throw new Error('layoutAuditFps must be between 2 and 12');
  if (!(Number.isInteger(maxLayoutEvidence) && maxLayoutEvidence >= 1 && maxLayoutEvidence <= 30)) throw new Error('maxLayoutEvidence must be an integer between 1 and 30');
  await mkdir(absoluteOutput, { recursive: true });

  let sourceQuality: AdvancedQualityLint | undefined;
  let plan: MotionPlan | undefined;
  const projectFile = options.projectFile ? resolve(options.projectFile) : undefined;
  const motionPlanPath = options.motionPlanPath
    ? resolve(options.motionPlanPath)
    : projectFile
      ? join(dirname(projectFile), 'motion-plan.json')
      : undefined;
  if (projectFile) sourceQuality = await lintAdvancedVideoQuality(projectFile, motionPlanPath);
  if (motionPlanPath) {
    try {
      plan = await readMotionPlan(motionPlanPath);
    } catch (error) {
      // The source-quality report already carries the actionable parse error.
      if (!sourceQuality) throw error;
    }
  }

  const declaredTransitions = plan?.reviewMoments
    .filter((moment) => moment.kind === 'transition')
    .map((moment) => moment.time) ?? [];
  const transitionTimes = uniqueTimes([...(options.transitionTimes ?? []), ...declaredTransitions]);
  if (transitionTimes.length > 30) throw new Error('At most 30 transition times may be reviewed');
  if (transitionTimes.some((time) => time < 0 || time > video.duration)) throw new Error('Transition times must stay inside the video duration');

  const overviewSheets: string[] = [];
  const secondsPerSheet = interval * 16;
  for (let start = 0, index = 0; start < video.duration; start += secondsPerSheet, index += 1) {
    const output = join(absoluteOutput, `overview-${String(index + 1).padStart(2, '0')}.png`);
    const length = Math.min(secondsPerSheet, video.duration - start);
    const sampleEveryFrames = Math.max(1, Math.round(sourceFps * interval));
    await createContactSheet({
      ffmpegPath,
      videoPath: absoluteVideo,
      outputPath: output,
      selectionFilter: `trim=start=${ffmpegTime(start)}:duration=${ffmpegTime(length)},setpts=PTS-STARTPTS,select='not(mod(n\\,${sampleEveryFrames}))'`,
      columns: 4,
      rows: 4,
    });
    overviewSheets.push(output);
  }

  const transitionSheets: string[] = [];
  for (let index = 0; index < transitionTimes.length; index += 1) {
    const time = transitionTimes[index];
    const start = Math.max(0, time - transitionWindow);
    const length = Math.min(video.duration - start, transitionWindow * 2);
    const sampleEveryFrames = Math.max(1, Math.round(sourceFps / transitionFps));
    const output = join(absoluteOutput, `transition-${String(index + 1).padStart(2, '0')}-${time.toFixed(2)}s.png`);
    await createContactSheet({
      ffmpegPath,
      videoPath: absoluteVideo,
      outputPath: output,
      selectionFilter: `trim=start=${ffmpegTime(start)}:duration=${ffmpegTime(length)},setpts=PTS-STARTPTS,select='not(mod(n\\,${sampleEveryFrames}))'`,
      columns: 4,
      rows: 2,
    });
    transitionSheets.push(output);
  }

  const settledFrames = plan ? await extractSettledFrames(absoluteVideo, absoluteOutput, plan, video.duration) : [];

  const analysisArgs = ['-hide_banner', '-i', absoluteVideo, '-vf', 'blackdetect=d=0.25:pix_th=0.03,freezedetect=n=-55dB:d=1.5'];
  if (video.hasAudioStream) analysisArgs.push('-af', 'silencedetect=n=-50dB:d=2');
  analysisArgs.push('-f', 'null', '-');
  const analysis = await runCommand(ffmpegPath, analysisArgs, { quiet: true });
  const anomalyCandidates = anomalyLines(analysis.stderr);

  let layoutAuditVideo: string | undefined;
  let layoutEvidenceFrames: LayoutEvidence[] = [];
  if (projectFile) {
    const audit = await createLayoutAudit(
      projectFile,
      absoluteOutput,
      options.reviewRenderVariables ?? {},
      layoutAuditFps,
      maxLayoutEvidence,
    );
    layoutAuditVideo = audit.videoPath;
    layoutEvidenceFrames = audit.evidence;
  }

  const motionContinuity = plan
    ? await analyzeMotionContinuity(absoluteVideo, absoluteOutput, video, plan)
    : undefined;
  const evidenceFrames = [
    ...layoutEvidenceFrames.map((evidence) => evidence.path),
    ...(motionContinuity?.candidates.map((candidate) => candidate.evidencePath) ?? []),
    ...settledFrames,
  ];
  const manifestPath = join(absoluteOutput, 'review-manifest.json');
  const result: VisualReviewPack = {
    video,
    outputDir: absoluteOutput,
    overviewSheets,
    transitionSheets,
    settledFrames,
    anomalyCandidates,
    sourceQuality,
    layoutAuditVideo,
    layoutEvidenceFrames,
    motionContinuity,
    evidenceFrames,
    checklist: visualChecklist,
    manifestPath,
    deliveryBlockedUntil: 'The host AI has viewed every exact evidence frame, settled frame, overview sheet, and transition sheet; classified each candidate as intentional or material; corrected material issues; and regenerated this pack for the revised render.',
  };
  await writeFile(manifestPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}
