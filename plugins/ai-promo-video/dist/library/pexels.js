import { downloadFreeMedia } from './files.js';
import { orientation } from './license.js';
const PHOTO_API = 'https://api.pexels.com/v1';
const VIDEO_API = 'https://api.pexels.com/v1/videos';
const LICENSE_URL = 'https://www.pexels.com/license/';
const USER_AGENT = 'ai-promo-video/0.2.0 (open-source local media search)';
function key(apiKey) {
    const value = apiKey ?? process.env.PEXELS_API_KEY;
    if (!value)
        throw new Error('Pexels search requires the free PEXELS_API_KEY environment variable');
    return value;
}
async function apiJson(url, apiKey) {
    const response = await fetch(url, { headers: { Authorization: key(apiKey), 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!response.ok)
        throw new Error(`Pexels request failed (${response.status}): ${await response.text()}`);
    return response.json();
}
function preferredVideoFile(video) {
    const candidates = video.video_files
        .filter((file) => file.file_type === 'video/mp4' && file.width && file.height)
        .sort((a, b) => ((b.width ?? 0) * (b.height ?? 0)) - ((a.width ?? 0) * (a.height ?? 0)));
    return candidates.find((file) => (file.width ?? 0) <= 3840) ?? candidates[0];
}
export function normalizePexelsVideo(video) {
    const file = preferredVideoFile(video);
    const title = `Pexels video ${video.id}`;
    return {
        provider: 'pexels',
        kind: 'video',
        id: String(video.id),
        title,
        creator: video.user.name,
        duration: video.duration,
        width: file?.width ?? video.width,
        height: file?.height ?? video.height,
        orientation: orientation(video.width, video.height),
        mimeType: file?.file_type ?? 'video/mp4',
        license: 'Pexels License',
        licenseUrl: LICENSE_URL,
        attribution: `Video by ${video.user.name} on Pexels`,
        tags: ['pexels', 'stock-video'],
        downloadUrl: file?.link,
        previewUrl: video.image,
        landingUrl: video.url,
        selectable: Boolean(file?.link),
        requiresAttribution: false,
        requiresShareAlike: false,
        licenseReason: 'Free commercial use under the Pexels License; do not imply endorsement or redistribute the unaltered stock file.',
    };
}
export function normalizePexelsPhoto(photo) {
    const title = photo.alt || `Pexels photo ${photo.id}`;
    return {
        provider: 'pexels',
        kind: 'image',
        id: String(photo.id),
        title,
        creator: photo.photographer,
        width: photo.width,
        height: photo.height,
        orientation: orientation(photo.width, photo.height),
        mimeType: 'image/jpeg',
        license: 'Pexels License',
        licenseUrl: LICENSE_URL,
        attribution: `Photo by ${photo.photographer} on Pexels`,
        tags: ['pexels', 'stock-photo', ...title.split(/[^\p{L}\p{N}]+/u).filter(Boolean)],
        downloadUrl: photo.src.original,
        previewUrl: photo.src.medium ?? photo.src.large,
        landingUrl: photo.url,
        selectable: Boolean(photo.src.original),
        requiresAttribution: false,
        requiresShareAlike: false,
        licenseReason: 'Free commercial use under the Pexels License; do not imply endorsement or redistribute the unaltered stock file.',
    };
}
export async function searchPexelsVideos(options) {
    const url = new URL(`${VIDEO_API}/search`);
    url.searchParams.set('query', options.query);
    url.searchParams.set('per_page', String(Math.min(80, Math.max(1, options.pageSize ?? 12))));
    if (options.orientation)
        url.searchParams.set('orientation', options.orientation);
    if (options.locale)
        url.searchParams.set('locale', options.locale);
    if ((options.minWidth ?? 0) >= 3840)
        url.searchParams.set('size', 'large');
    else if ((options.minWidth ?? 0) >= 1920)
        url.searchParams.set('size', 'medium');
    else if ((options.minWidth ?? 0) >= 1280)
        url.searchParams.set('size', 'small');
    const payload = await apiJson(url, options.apiKey);
    return (payload.videos ?? []).map(normalizePexelsVideo).filter((result) => result.selectable
        && (options.minDuration === undefined || (result.duration ?? 0) >= options.minDuration)
        && (options.maxDuration === undefined || (result.duration ?? Infinity) <= options.maxDuration)
        && (options.minWidth === undefined || (result.width ?? 0) >= options.minWidth)
        && (options.minHeight === undefined || (result.height ?? 0) >= options.minHeight));
}
export async function searchPexelsPhotos(options) {
    const url = new URL(`${PHOTO_API}/search`);
    url.searchParams.set('query', options.query);
    url.searchParams.set('per_page', String(Math.min(80, Math.max(1, options.pageSize ?? 12))));
    if (options.orientation)
        url.searchParams.set('orientation', options.orientation);
    if (options.locale)
        url.searchParams.set('locale', options.locale);
    const payload = await apiJson(url, options.apiKey);
    return (payload.photos ?? []).map(normalizePexelsPhoto).filter((result) => result.selectable
        && (options.minWidth === undefined || (result.width ?? 0) >= options.minWidth)
        && (options.minHeight === undefined || (result.height ?? 0) >= options.minHeight));
}
export async function downloadPexelsVideo(id, outputDir, apiKey) {
    const result = normalizePexelsVideo(await apiJson(new URL(`${VIDEO_API}/videos/${encodeURIComponent(id)}`), apiKey));
    return downloadFreeMedia(result, outputDir, { userAgent: USER_AGENT });
}
export async function downloadPexelsPhoto(id, outputDir, apiKey) {
    const result = normalizePexelsPhoto(await apiJson(new URL(`${PHOTO_API}/photos/${encodeURIComponent(id)}`), apiKey));
    return downloadFreeMedia(result, outputDir, { userAgent: USER_AGENT, maxBytes: 100 * 1024 * 1024 });
}
//# sourceMappingURL=pexels.js.map