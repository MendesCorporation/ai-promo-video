import { access, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AudioTrack } from '../types.js';

interface AudioCatalog {
  version: number;
  tracks: AudioTrack[];
}

export function audioDirectory(): string {
  return fileURLToPath(new URL('../../assets/audio/', import.meta.url));
}

export async function loadAudioCatalog(): Promise<AudioCatalog> {
  const path = fileURLToPath(new URL('../../assets/audio/catalog.json', import.meta.url));
  return JSON.parse(await readFile(path, 'utf8')) as AudioCatalog;
}

export async function listAudioTracks(filters: { mood?: string; maxIntensity?: number } = {}): Promise<AudioTrack[]> {
  const catalog = await loadAudioCatalog();
  return catalog.tracks.filter((track) => {
    const matchesMood = !filters.mood || track.mood.some((mood) => mood.toLowerCase().includes(filters.mood!.toLowerCase()));
    const matchesIntensity = filters.maxIntensity === undefined || track.intensity <= filters.maxIntensity;
    return matchesMood && matchesIntensity;
  });
}

export async function resolveAudioTrack(id: string, baseFile?: string): Promise<string> {
  const catalog = await loadAudioCatalog();
  const track = catalog.tracks.find((candidate) => candidate.id === id);
  const path = track
    ? fileURLToPath(new URL(`../../assets/audio/${track.file}`, import.meta.url))
    : isAbsolute(id)
      ? id
      : baseFile
        ? resolve(dirname(baseFile), id)
        : resolve(id);
  try {
    await access(path);
  } catch {
    if (track) throw new Error(`Audio track ${id} has not been generated. Run \"npm run audio:generate\" first.`);
    throw new Error(`Music file not found: ${path}`);
  }
  return path;
}
