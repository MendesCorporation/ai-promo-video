import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { audioDirectory, loadAudioCatalog } from './catalog.js';

const SAMPLE_RATE = 44_100;
const CHANNELS = 2;
const LOOP_SECONDS = 16;

function midi(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function hashNoise(index: number): number {
  return fract(Math.sin(index * 12.9898 + 78.233) * 43_758.5453) * 2 - 1;
}

function envelope(time: number, attack: number, release: number, length: number): number {
  if (time < 0 || time > length) return 0;
  if (time < attack) return time / Math.max(attack, 0.001);
  return Math.min(1, (length - time) / Math.max(release, 0.001));
}

function osc(type: 'sine' | 'triangle', frequency: number, time: number): number {
  const phase = fract(frequency * time);
  if (type === 'triangle') return 1 - 4 * Math.abs(phase - 0.5);
  return Math.sin(phase * Math.PI * 2);
}

function synthSample(time: number, bpm: number, intensity: number, profile: number): [number, number] {
  const beatLength = 60 / bpm;
  const beat = Math.floor(time / beatLength);
  const beatTime = time - beat * beatLength;
  const halfBeat = Math.floor(time / (beatLength / 2));
  const halfTime = time - halfBeat * (beatLength / 2);
  const bar = Math.floor(beat / 4);
  const progression = [0, 5, -3, 7];
  const root = 45 + progression[bar % progression.length];

  const padFade = 0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, (time % (beatLength * 4)) / (beatLength * 4)));
  const padNotes = [0, 7, 12, 16];
  let left = 0;
  let right = 0;
  for (let index = 0; index < padNotes.length; index += 1) {
    const frequency = midi(root + padNotes[index]);
    const voice = osc('sine', frequency, time) * 0.45 + osc('triangle', frequency / 2, time) * 0.12;
    const pan = index / (padNotes.length - 1);
    left += voice * (1 - pan * 0.55);
    right += voice * (0.45 + pan * 0.55);
  }
  left *= 0.075 * padFade;
  right *= 0.075 * padFade;

  const arpSteps = profile === 0 ? [0, 7, 12, 7] : profile === 1 ? [0, 12, 7, 16, 12, 7, 19, 16] : [0, 7, 12, 16, 19, 16, 12, 7];
  const arpNote = root + 12 + arpSteps[halfBeat % arpSteps.length];
  const arpEnv = envelope(halfTime, 0.01, beatLength * 0.22, beatLength * 0.42);
  const arp = (osc('triangle', midi(arpNote), time) * 0.65 + osc('sine', midi(arpNote) * 2, time) * 0.15) * arpEnv;
  const arpPan = 0.5 + 0.35 * Math.sin(halfBeat * 1.7);
  left += arp * (0.045 + intensity * 0.055) * (1 - arpPan * 0.45);
  right += arp * (0.045 + intensity * 0.055) * (0.55 + arpPan * 0.45);

  const kickEnv = Math.exp(-beatTime * 14);
  const kickFrequency = 46 + 56 * Math.exp(-beatTime * 24);
  const kick = Math.sin(Math.PI * 2 * kickFrequency * beatTime) * kickEnv * (0.18 + intensity * 0.2);
  left += kick;
  right += kick;

  const bassLength = beatLength * 0.72;
  const bassEnv = envelope(beatTime, 0.015, beatLength * 0.25, bassLength);
  const bass = osc('sine', midi(root - 12), time) * bassEnv * (0.065 + intensity * 0.075);
  left += bass;
  right += bass;

  if (profile > 0) {
    const hatEnv = Math.exp(-halfTime * (profile === 2 ? 48 : 64));
    const hat = hashNoise(Math.floor(time * SAMPLE_RATE)) * hatEnv * (0.018 + intensity * 0.025);
    left += hat * (halfBeat % 2 ? 0.65 : 1);
    right += hat * (halfBeat % 2 ? 1 : 0.65);
  }

  if (profile === 2 && beat % 4 === 2) {
    const clapTime = beatTime;
    const clap = hashNoise(Math.floor(time * SAMPLE_RATE * 0.73)) * Math.exp(-clapTime * 26) * 0.08;
    left += clap;
    right += clap;
  }

  const sidechain = 0.68 + 0.32 * Math.min(1, beatTime / 0.15);
  return [Math.tanh(left * sidechain * 1.7), Math.tanh(right * sidechain * 1.7)];
}

function createWav(bpm: number, intensity: number, profile: number): Buffer {
  const sampleCount = Math.floor(SAMPLE_RATE * LOOP_SECONDS);
  const dataSize = sampleCount * CHANNELS * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * 2, 28);
  buffer.writeUInt16LE(CHANNELS * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE;
    const globalFade = Math.min(1, time / 0.25, (LOOP_SECONDS - time) / 0.25);
    const [left, right] = synthSample(time, bpm, intensity, profile);
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left * globalFade)) * 32_767), offset);
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right * globalFade)) * 32_767), offset + 2);
    offset += 4;
  }
  return buffer;
}

export async function generateAudioLibrary(): Promise<string[]> {
  const catalog = await loadAudioCatalog();
  const target = audioDirectory();
  await mkdir(target, { recursive: true });
  const outputs: string[] = [];
  for (let index = 0; index < catalog.tracks.length; index += 1) {
    const track = catalog.tracks[index];
    const path = join(target, track.file);
    await writeFile(path, createWav(track.bpm, track.intensity, index));
    console.log(`Generated ${track.id}: ${path}`);
    outputs.push(path);
  }
  return outputs;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  generateAudioLibrary().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
