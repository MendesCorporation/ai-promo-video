import { mkdir } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import ffmpegPathValue from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { runCommand } from '../utils/process.js';

export interface MusicEnergyPoint {
  time: number;
  energy: number;
  momentaryLufs: number;
}

export interface MusicAnalysis {
  path: string;
  duration: number;
  channels?: number;
  sampleRate?: number;
  integratedLufs?: number;
  loudnessRangeLu?: number;
  truePeakDbfs?: number;
  energyCurve: MusicEnergyPoint[];
  peakEnergyTimes: number[];
  silences: Array<{ start: number; end?: number; duration?: number }>;
  visualReview?: { waveform: string; spectrogram: string };
  usage: string;
}

function numericMatch(source: string, expression: RegExp): number | undefined {
  const match = source.match(expression);
  const value = match ? Number(match[1]) : NaN;
  return Number.isFinite(value) ? value : undefined;
}

function energyCurve(stderr: string): MusicEnergyPoint[] {
  const samples = [...stderr.matchAll(/\bt:\s*([0-9.]+).*?\bM:\s*(-?[0-9.]+)\s+S:/g)]
    .map((match) => ({ time: Number(match[1]), lufs: Number(match[2]) }))
    .filter((sample) => Number.isFinite(sample.time) && Number.isFinite(sample.lufs) && sample.lufs > -100);
  if (!samples.length) return [];

  const bins = new Map<number, number[]>();
  for (const sample of samples) {
    const bin = Math.floor(sample.time * 2) / 2;
    const values = bins.get(bin) ?? [];
    values.push(sample.lufs);
    bins.set(bin, values);
  }
  const averaged = [...bins].map(([time, values]) => ({
    time,
    lufs: values.reduce((sum, value) => sum + value, 0) / values.length,
  })).sort((a, b) => a.time - b.time);
  const levels = averaged.map((point) => point.lufs).sort((a, b) => a - b);
  const low = levels[Math.floor((levels.length - 1) * 0.1)];
  const high = levels[Math.floor((levels.length - 1) * 0.9)];
  const span = Math.max(1, high - low);
  return averaged.map((point) => ({
    time: Number(point.time.toFixed(2)),
    energy: Number(Math.min(1, Math.max(0, (point.lufs - low) / span)).toFixed(3)),
    momentaryLufs: Number(point.lufs.toFixed(2)),
  }));
}

function peakTimes(curve: MusicEnergyPoint[]): number[] {
  const selected: number[] = [];
  for (const point of [...curve].sort((a, b) => b.energy - a.energy || a.time - b.time)) {
    if (selected.every((time) => Math.abs(time - point.time) >= 2)) selected.push(point.time);
    if (selected.length === 5) break;
  }
  return selected.sort((a, b) => a - b);
}

function silenceRanges(stderr: string): Array<{ start: number; end?: number; duration?: number }> {
  const ranges: Array<{ start: number; end?: number; duration?: number }> = [];
  let current: { start: number; end?: number; duration?: number } | undefined;
  for (const line of stderr.split('\n')) {
    const start = numericMatch(line, /silence_start:\s*([0-9.]+)/);
    if (start !== undefined) {
      current = { start };
      ranges.push(current);
    }
    const end = numericMatch(line, /silence_end:\s*([0-9.]+)/);
    if (end !== undefined && current) {
      current.end = end;
      current.duration = numericMatch(line, /silence_duration:\s*([0-9.]+)/);
      current = undefined;
    }
  }
  return ranges;
}

export async function analyzeMusic(path: string, reviewDir?: string): Promise<MusicAnalysis> {
  const absolutePath = resolve(path);
  const ffmpegPath = ffmpegPathValue as unknown as string | null;
  if (!ffmpegPath) throw new Error('ffmpeg-static is unavailable');
  const probe = await runCommand(ffprobeStatic.path, [
    '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,channels,sample_rate', '-of', 'json', absolutePath,
  ], { quiet: true });
  const metadata = JSON.parse(probe.stdout) as {
    format?: { duration?: string };
    streams?: Array<{ codec_type?: string; channels?: number; sample_rate?: string }>;
  };
  const audioStream = metadata.streams?.find((stream) => stream.codec_type === 'audio');

  const measured = await runCommand(ffmpegPath, [
    '-hide_banner', '-nostats', '-i', absolutePath, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-',
  ], { quiet: true });
  const summary = measured.stderr.slice(Math.max(0, measured.stderr.lastIndexOf('Summary:')));
  const curve = energyCurve(measured.stderr);
  const silence = await runCommand(ffmpegPath, [
    '-hide_banner', '-nostats', '-i', absolutePath, '-af', 'silencedetect=noise=-45dB:d=0.5', '-f', 'null', '-',
  ], { quiet: true });

  let visualReview: MusicAnalysis['visualReview'];
  if (reviewDir) {
    const directory = resolve(reviewDir);
    await mkdir(directory, { recursive: true });
    const stem = basename(absolutePath, extname(absolutePath)).replace(/[^a-zA-Z0-9_-]+/g, '-');
    const waveform = join(directory, `${stem}-waveform.png`);
    const spectrogram = join(directory, `${stem}-spectrogram.png`);
    await runCommand(ffmpegPath, [
      '-y', '-hide_banner', '-loglevel', 'error', '-i', absolutePath,
      '-filter_complex', 'showwavespic=s=1600x320:colors=white|0x67e8f9:scale=sqrt', '-frames:v', '1', waveform,
    ], { quiet: true });
    await runCommand(ffmpegPath, [
      '-y', '-hide_banner', '-loglevel', 'error', '-i', absolutePath,
      '-lavfi', 'showspectrumpic=s=1600x500:legend=disabled:color=viridis:scale=sqrt', '-frames:v', '1', spectrogram,
    ], { quiet: true });
    visualReview = { waveform, spectrogram };
  }

  return {
    path: absolutePath,
    duration: Number(Number(metadata.format?.duration ?? 0).toFixed(3)),
    channels: audioStream?.channels,
    sampleRate: audioStream?.sample_rate ? Number(audioStream.sample_rate) : undefined,
    integratedLufs: numericMatch(summary, /Integrated loudness:[\s\S]*?\bI:\s*(-?[0-9.]+)\s+LUFS/),
    loudnessRangeLu: numericMatch(summary, /Loudness range:[\s\S]*?\bLRA:\s*([0-9.]+)\s+LU/),
    truePeakDbfs: numericMatch(summary, /True peak:[\s\S]*?\bPeak:\s*(-?[0-9.]+)\s+dBFS/),
    energyCurve: curve,
    peakEnergyTimes: peakTimes(curve),
    silences: silenceRanges(silence.stderr),
    visualReview,
    usage: 'Use this technical profile to compare candidates and place edits. It does not recommend a track and does not replace listening when the host can audition audio.',
  };
}
