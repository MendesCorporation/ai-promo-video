import type { FreeMediaSearchResult, MediaOrientation } from '../types.js';
import { downloadFreeMedia } from './files.js';
import { orientation } from './license.js';

const API = 'https://pixabay.com/api/';
const VIDEO_API = 'https://pixabay.com/api/videos/';
const LICENSE_URL = 'https://pixabay.com/service/license-summary/';
const USER_AGENT = 'ai-promo-video/0.2.0 (open-source local media search)';

interface PixabayImage {
  id: number;
  pageURL: string;
  tags?: string;
  user: string;
  imageWidth: number;
  imageHeight: number;
  largeImageURL?: string;
  webformatURL?: string;
}

interface PixabayVideoFile {
  url: string;
  width: number;
  height: number;
  size?: number;
  thumbnail?: string;
}

interface PixabayVideo {
  id: number;
  pageURL: string;
  tags?: string;
  duration?: number;
  user: string;
  videos: Record<string, PixabayVideoFile | undefined>;
}

function key(apiKey?: string): string {
  const value = apiKey ?? process.env.PIXABAY_API_KEY;
  if (!value) throw new Error('Pixabay search requires the free PIXABAY_API_KEY environment variable');
  return value;
}

async function apiJson<T>(url: URL, apiKey?: string): Promise<T> {
  url.searchParams.set('key', key(apiKey));
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Pixabay request failed (${response.status}): ${await response.text()}`);
  return response.json() as Promise<T>;
}

function preferredVideoFile(video: PixabayVideo): PixabayVideoFile | undefined {
  const candidates = Object.values(video.videos)
    .filter((file): file is PixabayVideoFile => Boolean(file?.url && file.width && file.height))
    .sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return candidates.find((file) => file.width <= 3840) ?? candidates[0];
}

function tags(value?: string): string[] {
  return (value ?? '').split(',').map((tag) => tag.trim()).filter(Boolean);
}

export function normalizePixabayVideo(video: PixabayVideo): FreeMediaSearchResult {
  const file = preferredVideoFile(video);
  const title = tags(video.tags).join(' · ') || `Pixabay video ${video.id}`;
  return {
    provider: 'pixabay',
    kind: 'video',
    id: String(video.id),
    title,
    creator: video.user,
    duration: video.duration,
    width: file?.width,
    height: file?.height,
    orientation: orientation(file?.width, file?.height),
    mimeType: 'video/mp4',
    fileSize: file?.size,
    license: 'Pixabay Content License',
    licenseUrl: LICENSE_URL,
    attribution: `Video by ${video.user} on Pixabay`,
    tags: ['pixabay', 'stock-video', ...tags(video.tags)],
    downloadUrl: file?.url,
    previewUrl: file?.thumbnail,
    landingUrl: video.pageURL,
    selectable: Boolean(file?.url),
    requiresAttribution: false,
    requiresShareAlike: false,
    licenseReason: 'Free commercial use and modification under the Pixabay Content License; do not redistribute the asset on a standalone basis or imply endorsement.',
  };
}

export function normalizePixabayImage(image: PixabayImage): FreeMediaSearchResult {
  const title = tags(image.tags).join(' · ') || `Pixabay image ${image.id}`;
  return {
    provider: 'pixabay',
    kind: 'image',
    id: String(image.id),
    title,
    creator: image.user,
    width: image.imageWidth,
    height: image.imageHeight,
    orientation: orientation(image.imageWidth, image.imageHeight),
    mimeType: 'image/jpeg',
    license: 'Pixabay Content License',
    licenseUrl: LICENSE_URL,
    attribution: `Image by ${image.user} on Pixabay`,
    tags: ['pixabay', 'stock-image', ...tags(image.tags)],
    downloadUrl: image.largeImageURL,
    previewUrl: image.webformatURL,
    landingUrl: image.pageURL,
    selectable: Boolean(image.largeImageURL),
    requiresAttribution: false,
    requiresShareAlike: false,
    licenseReason: 'Free commercial use and modification under the Pixabay Content License; do not redistribute the asset on a standalone basis or imply endorsement.',
  };
}

export async function searchPixabayVideos(options: {
  query: string;
  orientation?: MediaOrientation;
  minDuration?: number;
  maxDuration?: number;
  minWidth?: number;
  minHeight?: number;
  pageSize?: number;
  locale?: string;
  apiKey?: string;
}): Promise<FreeMediaSearchResult[]> {
  const url = new URL(VIDEO_API);
  url.searchParams.set('q', options.query);
  url.searchParams.set('per_page', String(Math.min(200, Math.max(3, options.pageSize ?? 12))));
  url.searchParams.set('safesearch', 'true');
  if (options.locale) url.searchParams.set('lang', options.locale);
  const payload = await apiJson<{ hits?: PixabayVideo[] }>(url, options.apiKey);
  return (payload.hits ?? []).map(normalizePixabayVideo).filter((result) => result.selectable
    && (options.orientation === undefined || result.orientation === options.orientation)
    && (options.minDuration === undefined || (result.duration ?? 0) >= options.minDuration)
    && (options.maxDuration === undefined || (result.duration ?? Infinity) <= options.maxDuration)
    && (options.minWidth === undefined || (result.width ?? 0) >= options.minWidth)
    && (options.minHeight === undefined || (result.height ?? 0) >= options.minHeight));
}

export async function searchPixabayImages(options: {
  query: string;
  orientation?: MediaOrientation;
  minWidth?: number;
  minHeight?: number;
  pageSize?: number;
  locale?: string;
  apiKey?: string;
}): Promise<FreeMediaSearchResult[]> {
  const url = new URL(API);
  url.searchParams.set('q', options.query);
  url.searchParams.set('per_page', String(Math.min(200, Math.max(3, options.pageSize ?? 12))));
  url.searchParams.set('image_type', 'all');
  url.searchParams.set('safesearch', 'true');
  if (options.orientation === 'landscape') url.searchParams.set('orientation', 'horizontal');
  if (options.orientation === 'portrait') url.searchParams.set('orientation', 'vertical');
  if (options.minWidth) url.searchParams.set('min_width', String(options.minWidth));
  if (options.minHeight) url.searchParams.set('min_height', String(options.minHeight));
  if (options.locale) url.searchParams.set('lang', options.locale);
  const payload = await apiJson<{ hits?: PixabayImage[] }>(url, options.apiKey);
  return (payload.hits ?? []).map(normalizePixabayImage).filter((result) => result.selectable
    && (options.orientation === undefined || result.orientation === options.orientation)
    && (options.minWidth === undefined || (result.width ?? 0) >= options.minWidth)
    && (options.minHeight === undefined || (result.height ?? 0) >= options.minHeight));
}

async function findPixabayVideo(id: string, apiKey?: string): Promise<FreeMediaSearchResult> {
  const url = new URL(VIDEO_API);
  url.searchParams.set('id', id);
  const payload = await apiJson<{ hits?: PixabayVideo[] }>(url, apiKey);
  const item = payload.hits?.[0];
  if (!item) throw new Error(`Pixabay video ${id} was not found`);
  return normalizePixabayVideo(item);
}

async function findPixabayImage(id: string, apiKey?: string): Promise<FreeMediaSearchResult> {
  const url = new URL(API);
  url.searchParams.set('id', id);
  const payload = await apiJson<{ hits?: PixabayImage[] }>(url, apiKey);
  const item = payload.hits?.[0];
  if (!item) throw new Error(`Pixabay image ${id} was not found`);
  return normalizePixabayImage(item);
}

export async function downloadPixabayVideo(id: string, outputDir: string, apiKey?: string): Promise<FreeMediaSearchResult> {
  return downloadFreeMedia(await findPixabayVideo(id, apiKey), outputDir, { userAgent: USER_AGENT });
}

export async function downloadPixabayImage(id: string, outputDir: string, apiKey?: string): Promise<FreeMediaSearchResult> {
  return downloadFreeMedia(await findPixabayImage(id, apiKey), outputDir, { userAgent: USER_AGENT, maxBytes: 100 * 1024 * 1024 });
}
