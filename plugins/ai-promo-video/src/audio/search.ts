import { access, readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import ffprobeStatic from 'ffprobe-static';
import type { MusicSearchResult } from '../types.js';
import { audioDirectory, loadAudioCatalog } from './catalog.js';
import { searchOpenverseMusic } from './openverse.js';
import { runCommand } from '../utils/process.js';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.opus']);
const PRIORITY_AUDIO_SOURCES = ['freesound', 'jamendo', 'wikimedia_audio'] as const;

export type MusicSearchProvider = 'all' | 'local' | 'bundled' | 'freesound' | 'jamendo' | 'wikimedia_audio' | 'openverse';

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const output: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else if (AUDIO_EXTENSIONS.has(extname(entry.name).toLowerCase())) output.push(path);
  }
  return output;
}

async function duration(path: string): Promise<number | undefined> {
  try {
    const result = await runCommand(ffprobeStatic.path, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path], { quiet: true });
    const seconds = Number((JSON.parse(result.stdout) as { format?: { duration?: string } }).format?.duration);
    return Number.isFinite(seconds) ? seconds : undefined;
  } catch {
    return undefined;
  }
}

async function sidecar(path: string): Promise<Record<string, unknown>> {
  for (const candidate of [`${path}.json`, join(path, '..', `${basename(path, extname(path))}.json`)]) {
    try {
      await access(candidate);
      return JSON.parse(await readFile(candidate, 'utf8')) as Record<string, unknown>;
    } catch {
      // Sidecar metadata is optional.
    }
  }
  return {};
}

function matches(result: MusicSearchResult, query?: string): boolean {
  if (!query) return true;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${result.title} ${result.creator ?? ''} ${result.tags.join(' ')}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export async function searchLocalMusic(options: {
  query?: string;
  directories?: string[];
  includeBundled?: boolean;
  allowUnknownLicense?: boolean;
  minDuration?: number;
  maxDuration?: number;
} = {}): Promise<MusicSearchResult[]> {
  const bundled = options.includeBundled === true
    ? await Promise.all((await loadAudioCatalog()).tracks.map(async (track): Promise<MusicSearchResult> => ({
      provider: 'bundled',
      id: track.id,
      title: track.title,
      duration: await duration(join(audioDirectory(), track.file)),
      license: track.license,
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution: `${track.title} — AI Promo Video contributors — CC0-1.0`,
      tags: track.mood,
      localPath: join(audioDirectory(), track.file),
      selectable: true,
    })))
    : [];

  const local: MusicSearchResult[] = [];
  for (const directory of options.directories ?? []) {
    for (const path of await walk(resolve(directory)).catch(() => [])) {
      const metadata = await sidecar(path);
      const license = String(metadata.license ?? 'unknown');
      local.push({
        provider: 'local',
        id: path,
        title: String(metadata.title ?? basename(path, extname(path))),
        creator: metadata.creator ? String(metadata.creator) : undefined,
        duration: typeof metadata.duration === 'number' ? metadata.duration : await duration(path),
        license,
        licenseUrl: metadata.licenseUrl ? String(metadata.licenseUrl) : undefined,
        attribution: metadata.attribution ? String(metadata.attribution) : undefined,
        tags: Array.isArray(metadata.tags) ? metadata.tags.map(String) : basename(path, extname(path)).split(/[-_ ]+/),
        localPath: path,
        selectable: license !== 'unknown' || options.allowUnknownLicense === true,
      });
    }
  }

  return [...(options.includeBundled === true ? bundled : []), ...local].filter((result) => matches(result, options.query)
    && (options.minDuration === undefined || (result.duration ?? 0) >= options.minDuration)
    && (options.maxDuration === undefined || (result.duration ?? Infinity) <= options.maxDuration));
}

function dedupeMusic(results: MusicSearchResult[]): MusicSearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.provider}:${result.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchMusic(options: {
  query?: string;
  provider?: MusicSearchProvider;
  localDirectories?: string[];
  includeBundled?: boolean;
  source?: string;
  minDuration?: number;
  maxDuration?: number;
  allowUnknownLocalLicense?: boolean;
} = {}): Promise<MusicSearchResult[]> {
  const provider = options.provider ?? 'all';
  const common = { minDuration: options.minDuration, maxDuration: options.maxDuration };

  if (provider === 'local' || provider === 'bundled') {
    return searchLocalMusic({
      query: options.query,
      directories: options.localDirectories,
      includeBundled: provider === 'bundled' || options.includeBundled === true,
      allowUnknownLicense: options.allowUnknownLocalLicense,
      ...common,
    });
  }

  if (!options.query) throw new Error('Online music search requires a query');

  if (provider === 'openverse') {
    return searchOpenverseMusic({ query: options.query, source: options.source, ...common });
  }

  if (provider !== 'all') {
    return searchOpenverseMusic({ query: options.query, source: provider, ...common });
  }

  const [freesound, local, jamendo, wikimedia] = await Promise.all([
    searchOpenverseMusic({ query: options.query, source: PRIORITY_AUDIO_SOURCES[0], ...common }),
    searchLocalMusic({
      query: options.query,
      directories: options.localDirectories,
      includeBundled: options.includeBundled,
      allowUnknownLicense: options.allowUnknownLocalLicense,
      ...common,
    }),
    searchOpenverseMusic({ query: options.query, source: PRIORITY_AUDIO_SOURCES[1], ...common }),
    searchOpenverseMusic({ query: options.query, source: PRIORITY_AUDIO_SOURCES[2], ...common }),
  ]);

  return dedupeMusic([...freesound, ...local, ...jamendo, ...wikimedia]);
}
