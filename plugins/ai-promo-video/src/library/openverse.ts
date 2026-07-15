import { extname } from 'node:path';
import type { FreeMediaKind, FreeMediaSearchResult, MediaOrientation } from '../types.js';
import { assessFreeLicense, orientation } from './license.js';
import { downloadFreeMedia } from './files.js';

const API = 'https://api.openverse.org/v1/images/';
const USER_AGENT = 'ai-promo-video/0.2.0 (open-source local media search)';

interface OpenverseImage {
  id: string;
  title?: string;
  creator?: string;
  license: string;
  license_url?: string;
  attribution?: string;
  url?: string;
  thumbnail?: string;
  foreign_landing_url?: string;
  filetype?: string;
  width?: number;
  height?: number;
  filesize?: number;
  tags?: Array<{ name?: string }>;
}

async function apiJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Openverse image request failed (${response.status}): ${await response.text()}`);
  return response.json() as Promise<T>;
}

function kind(item: OpenverseImage): FreeMediaKind {
  const declared = item.filetype?.toLowerCase();
  if (declared === 'svg') return 'svg';
  if (declared === 'gif') return 'animation';
  if (item.url) {
    try {
      const extension = extname(new URL(item.url).pathname).toLowerCase();
      if (extension === '.svg') return 'svg';
      if (extension === '.gif') return 'animation';
    } catch {
      // Use the default image kind.
    }
  }
  return 'image';
}

function normalize(item: OpenverseImage, includeShareAlike = false): FreeMediaSearchResult {
  const mediaKind = kind(item);
  const license = item.license ? `CC ${item.license.toUpperCase()}` : 'unknown';
  const decision = assessFreeLicense(license, { includeShareAlike });
  const title = item.title || 'Untitled asset';
  return {
    provider: 'openverse',
    kind: mediaKind,
    id: item.id,
    title,
    creator: item.creator,
    width: item.width,
    height: item.height,
    orientation: orientation(item.width, item.height),
    mimeType: item.filetype ? (mediaKind === 'svg' ? 'image/svg+xml' : mediaKind === 'animation' ? 'image/gif' : `image/${item.filetype.toLowerCase()}`) : undefined,
    fileSize: item.filesize,
    license,
    licenseUrl: item.license_url,
    attribution: item.attribution ?? `${title}${item.creator ? ` — ${item.creator}` : ''} — ${license}`,
    tags: item.tags?.map((tag) => tag.name).filter((name): name is string => Boolean(name)) ?? [],
    downloadUrl: item.url,
    previewUrl: item.thumbnail,
    landingUrl: item.foreign_landing_url,
    selectable: decision.selectable && Boolean(item.url),
    requiresAttribution: decision.requiresAttribution,
    requiresShareAlike: decision.requiresShareAlike,
    licenseReason: decision.reason,
  };
}

export async function searchOpenverseAssets(options: {
  query: string;
  kind?: 'all' | 'image' | 'svg' | 'animation';
  orientation?: MediaOrientation;
  source?: string;
  pageSize?: number;
  minWidth?: number;
  minHeight?: number;
  includeShareAlike?: boolean;
}): Promise<FreeMediaSearchResult[]> {
  const url = new URL(API);
  url.searchParams.set('q', options.query);
  const licenses = ['cc0', 'pdm', 'by'];
  if (options.includeShareAlike) licenses.push('by-sa');
  url.searchParams.set('license', licenses.join(','));
  url.searchParams.set('page_size', String(Math.min(50, Math.max(1, options.pageSize ?? 12))));
  url.searchParams.set('mature', 'false');
  if (options.source) url.searchParams.set('source', options.source);
  if (options.orientation) url.searchParams.set('aspect_ratio', options.orientation === 'landscape' ? 'wide' : options.orientation === 'portrait' ? 'tall' : 'square');
  if (options.kind === 'svg') url.searchParams.set('extension', 'svg');
  if (options.kind === 'animation') url.searchParams.set('extension', 'gif');

  const payload = await apiJson<{ results?: OpenverseImage[] }>(url.toString());
  return (payload.results ?? [])
    .map((item) => normalize(item, options.includeShareAlike))
    .filter((result) => result.selectable
      && (options.kind === undefined || options.kind === 'all' || result.kind === options.kind || (options.kind === 'image' && result.kind === 'image'))
      && (options.minWidth === undefined || (result.width ?? 0) >= options.minWidth)
      && (options.minHeight === undefined || (result.height ?? 0) >= options.minHeight));
}

export async function downloadOpenverseAsset(id: string, outputDir: string, options: { includeShareAlike?: boolean } = {}): Promise<FreeMediaSearchResult> {
  const item = await apiJson<OpenverseImage>(`${API}${encodeURIComponent(id)}/`);
  return downloadFreeMedia(normalize(item, options.includeShareAlike), outputDir, { userAgent: USER_AGENT, maxBytes: 100 * 1024 * 1024 });
}
