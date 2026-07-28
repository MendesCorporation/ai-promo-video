import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import type { MusicSearchResult } from '../types.js';

const API = 'https://api.openverse.org/v1/audio/';
const SAFE_LICENSES = new Set(['cc0', 'pdm', 'by']);
const USER_AGENT = 'ai-promo-video/0.2.0 (open-source local media search)';

interface OpenverseAudio {
  id: string;
  title: string;
  creator?: string;
  source?: string;
  duration?: number;
  license: string;
  license_url?: string;
  attribution?: string;
  url?: string;
  foreign_landing_url?: string;
  filetype?: string;
  tags?: Array<{ name?: string }>;
}

function normalize(item: OpenverseAudio): MusicSearchResult {
  return {
    provider: 'openverse',
    source: item.source,
    id: item.id,
    title: item.title || 'Untitled track',
    creator: item.creator,
    duration: item.duration ? item.duration / 1000 : undefined,
    license: item.license,
    licenseUrl: item.license_url,
    attribution: item.attribution,
    tags: item.tags?.map((tag) => tag.name).filter((name): name is string => Boolean(name)) ?? [],
    downloadUrl: item.url,
    landingUrl: item.foreign_landing_url,
    selectable: SAFE_LICENSES.has(item.license.toLowerCase()) && Boolean(item.url),
  };
}

async function apiJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Openverse request failed (${response.status}): ${await response.text()}`);
  return response.json() as Promise<T>;
}

export async function searchOpenverseMusic(options: {
  query: string;
  licenses?: Array<'cc0' | 'pdm' | 'by'>;
  source?: string;
  pageSize?: number;
  minDuration?: number;
  maxDuration?: number;
}): Promise<MusicSearchResult[]> {
  const url = new URL(API);
  url.searchParams.set('q', options.query);
  url.searchParams.set('license', (options.licenses ?? ['cc0', 'pdm', 'by']).join(','));
  url.searchParams.set('page_size', String(Math.min(50, Math.max(1, options.pageSize ?? 12))));
  url.searchParams.set('mature', 'false');
  if (options.source) url.searchParams.set('source', options.source);
  const payload = await apiJson<{ results?: OpenverseAudio[] }>(url.toString());
  return (payload.results ?? []).map(normalize).filter((result) => result.selectable
    && (options.minDuration === undefined || (result.duration ?? 0) >= options.minDuration)
    && (options.maxDuration === undefined || (result.duration ?? Infinity) <= options.maxDuration));
}

export function openverseAudioExtension(filetype?: string, url?: string): string {
  const declared = filetype?.toLowerCase();
  if (declared === 'mp3' || declared === 'mp32') return '.mp3';
  if (declared && /^[a-z0-9]+$/.test(declared)) return `.${declared}`;
  const fromUrl = url ? extname(new URL(url).pathname).toLowerCase() : '';
  return fromUrl || '.mp3';
}

export async function downloadOpenverseMusic(id: string, outputDir: string): Promise<MusicSearchResult> {
  const item = await apiJson<OpenverseAudio>(`${API}${encodeURIComponent(id)}/`);
  const result = normalize(item);
  if (!result.selectable || !item.url) throw new Error(`Track ${id} is missing a downloadable URL or uses an unsupported license: ${item.license}`);

  const response = await fetch(item.url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Music download failed (${response.status})`);
  const declaredBytes = Number(response.headers.get('content-length') ?? 0);
  if (declaredBytes > 100 * 1024 * 1024) throw new Error('Music file exceeds the 100 MB safety limit');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 100 * 1024 * 1024) throw new Error('Music file exceeds the 100 MB safety limit');

  const targetDir = resolve(outputDir);
  await mkdir(targetDir, { recursive: true });
  const path = join(targetDir, `openverse-${item.id}${openverseAudioExtension(item.filetype, item.url)}`);
  await writeFile(path, bytes);
  const metadataPath = `${path}.json`;
  await writeFile(metadataPath, `${JSON.stringify({ ...result, localPath: path, downloadedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8');

  const creditsPath = join(targetDir, 'credits.json');
  let credits: unknown[] = [];
  try {
    const parsed = JSON.parse(await readFile(creditsPath, 'utf8')) as unknown;
    if (Array.isArray(parsed)) credits = parsed;
  } catch {
    // Start a new credits manifest.
  }
  const withoutCurrent = credits.filter((entry) => (entry as { id?: string }).id !== result.id);
  withoutCurrent.push({
    provider: result.provider,
    source: result.source,
    id: result.id,
    title: result.title,
    creator: result.creator,
    license: result.license,
    licenseUrl: result.licenseUrl,
    attribution: result.attribution,
    landingUrl: result.landingUrl,
    localPath: path,
  });
  await writeFile(creditsPath, `${JSON.stringify(withoutCurrent, null, 2)}\n`, 'utf8');
  return { ...result, localPath: path };
}
