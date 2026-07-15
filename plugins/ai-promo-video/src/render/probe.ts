import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import ffmpegPathValue from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
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
  hasAudio: boolean;
}

function ratio(value?: string): number | undefined {
  if (!value) return undefined;
  const [numerator, denominator] = value.split('/').map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return undefined;
  return numerator / denominator;
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
  return {
    path: absolutePath,
    duration: Number(payload.format?.duration ?? 0),
    size: Number(payload.format?.size ?? 0),
    width: video?.width,
    height: video?.height,
    fps: ratio(video?.r_frame_rate),
    videoCodec: video?.codec_name,
    audioCodec: audio?.codec_name,
    hasAudio: Boolean(audio),
  };
}

export async function extractReviewFrames(videoPath: string, outputDir: string, times: number[]): Promise<string[]> {
  const ffmpegPath = ffmpegPathValue as unknown as string | null;
  if (!ffmpegPath) throw new Error('ffmpeg-static did not provide a binary for this platform');
  const absoluteVideo = resolve(videoPath);
  const absoluteOutput = resolve(outputDir);
  await mkdir(absoluteOutput, { recursive: true });
  const outputs: string[] = [];
  for (let index = 0; index < times.length; index += 1) {
    const output = join(absoluteOutput, `review-${String(index + 1).padStart(2, '0')}-${times[index].toFixed(1)}s.png`);
    await mkdir(dirname(output), { recursive: true });
    await runCommand(ffmpegPath, ['-y', '-ss', String(times[index]), '-i', absoluteVideo, '-frames:v', '1', '-compression_level', '4', output], { quiet: true });
    outputs.push(output);
  }
  return outputs;
}

export interface VisualReviewOptions {
  overviewInterval?: number;
  transitionTimes?: number[];
  transitionWindow?: number;
  transitionFps?: number;
}

export interface VisualReviewPack {
  video: VideoProbe;
  outputDir: string;
  overviewSheets: string[];
  transitionSheets: string[];
  anomalyCandidates: string[];
  checklist: string[];
  manifestPath: string;
  deliveryBlockedUntil: string;
}

const visualChecklist = [
  'Inspect optical spacing between words, letters, logos, icons, and UI groups after every animation settles.',
  'Look for unintended tracking, collisions, clipping, overflow, orphaned words, and text that reads as disconnected labels.',
  'Compare frames immediately before, during, and after every transition for flashes, jumps, stale layers, or mismatched direction.',
  'Verify camera scale, rotation, perspective, and motion blur preserve hierarchy and legibility.',
  'Verify cursor paths, click responses, card assembly, masks, particles, and UI states have a visible cause and clean result.',
  'Confirm the final CTA is stable, readable, centered, and held long enough.',
  'Treat black, frozen, or silent segments as review candidates, not automatic failures; decide from the intended direction.',
];

function anomalyLines(stderr: string): string[] {
  return stderr
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /black_(start|end)|freeze_(start|end|duration)|silence_(start|end|duration)/.test(line));
}

export async function createVisualReviewPack(videoPath: string, outputDir: string, options: VisualReviewOptions = {}): Promise<VisualReviewPack> {
  const ffmpegPath = ffmpegPathValue as unknown as string | null;
  if (!ffmpegPath) throw new Error('ffmpeg-static did not provide a binary for this platform');
  const video = await probeVideo(videoPath);
  const absoluteVideo = resolve(videoPath);
  const absoluteOutput = resolve(outputDir);
  const interval = options.overviewInterval ?? 2;
  const transitionWindow = options.transitionWindow ?? 1;
  const transitionFps = options.transitionFps ?? 4;
  const transitionTimes = [...new Set(options.transitionTimes ?? [])].sort((a, b) => a - b);
  if (!(interval >= 0.25 && interval <= 10)) throw new Error('overviewInterval must be between 0.25 and 10 seconds');
  if (!(transitionWindow >= 0.25 && transitionWindow <= 3)) throw new Error('transitionWindow must be between 0.25 and 3 seconds');
  if (!(transitionFps >= 1 && transitionFps <= 12)) throw new Error('transitionFps must be between 1 and 12');
  if (transitionTimes.length > 30) throw new Error('At most 30 transition times may be reviewed');
  if (transitionTimes.some((time) => time < 0 || time > video.duration)) throw new Error('Transition times must stay inside the video duration');
  await mkdir(absoluteOutput, { recursive: true });

  const overviewSheets: string[] = [];
  const secondsPerSheet = interval * 16;
  for (let start = 0, index = 0; start < video.duration; start += secondsPerSheet, index += 1) {
    const output = join(absoluteOutput, `overview-${String(index + 1).padStart(2, '0')}.png`);
    const length = Math.min(secondsPerSheet, video.duration - start);
    await runCommand(ffmpegPath, [
      '-y', '-ss', String(start), '-t', String(length), '-i', absoluteVideo,
      '-vf', `fps=1/${interval},scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2:color=black,tile=4x4`,
      '-frames:v', '1', '-compression_level', '4', output,
    ], { quiet: true });
    overviewSheets.push(output);
  }

  const transitionSheets: string[] = [];
  for (let index = 0; index < transitionTimes.length; index += 1) {
    const time = transitionTimes[index];
    const start = Math.max(0, time - transitionWindow);
    const length = Math.min(video.duration - start, transitionWindow * 2);
    const output = join(absoluteOutput, `transition-${String(index + 1).padStart(2, '0')}-${time.toFixed(2)}s.png`);
    await runCommand(ffmpegPath, [
      '-y', '-ss', String(start), '-t', String(length), '-i', absoluteVideo,
      '-vf', `fps=${transitionFps},scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2:color=black,tile=4x2`,
      '-frames:v', '1', '-compression_level', '4', output,
    ], { quiet: true });
    transitionSheets.push(output);
  }

  const analysisArgs = ['-hide_banner', '-i', absoluteVideo, '-vf', 'blackdetect=d=0.25:pix_th=0.03,freezedetect=n=-55dB:d=1.5'];
  if (video.hasAudio) analysisArgs.push('-af', 'silencedetect=n=-50dB:d=2');
  analysisArgs.push('-f', 'null', '-');
  const analysis = await runCommand(ffmpegPath, analysisArgs, { quiet: true });
  const anomalyCandidates = anomalyLines(analysis.stderr);
  const manifestPath = join(absoluteOutput, 'review-manifest.json');
  const result: VisualReviewPack = {
    video,
    outputDir: absoluteOutput,
    overviewSheets,
    transitionSheets,
    anomalyCandidates,
    checklist: visualChecklist,
    manifestPath,
    deliveryBlockedUntil: 'The host AI has viewed every overview and transition sheet, documented anomalies, corrected material issues, and regenerated this pack for the revised render.',
  };
  await writeFile(manifestPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}
