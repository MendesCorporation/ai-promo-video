import { assessFreeLicense, orientation } from './license.js';
import { downloadFreeMedia } from './files.js';
const API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'ai-promo-video/0.2.0 (open-source local media search)';
const METADATA_FILTER = 'LicenseShortName|LicenseUrl|Artist|Credit|AttributionRequired|UsageTerms';
async function apiJson(url) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!response.ok)
        throw new Error(`Wikimedia Commons request failed (${response.status}): ${await response.text()}`);
    return response.json();
}
function plainText(value) {
    if (!value)
        return undefined;
    const result = value
        .replace(/<[^>]*>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
    return result || undefined;
}
function mediaKind(info) {
    if (info.mediatype?.toUpperCase() === 'VIDEO' || info.mime?.startsWith('video/') || (info.mime === 'application/ogg' && info.duration !== undefined))
        return 'video';
    if (info.mime === 'image/svg+xml')
        return 'svg';
    if (info.mime === 'image/gif')
        return 'animation';
    if (info.mime?.startsWith('image/'))
        return 'image';
    return undefined;
}
function normalize(page, includeShareAlike = false) {
    const info = page.imageinfo?.[0];
    if (!info)
        return undefined;
    const kind = mediaKind(info);
    if (!kind)
        return undefined;
    const metadata = info.extmetadata ?? {};
    const license = plainText(metadata.LicenseShortName?.value) ?? plainText(metadata.UsageTerms?.value) ?? 'unknown';
    const creator = plainText(metadata.Artist?.value);
    const decision = assessFreeLicense(license, { includeShareAlike });
    const title = page.title.replace(/^File:/i, '');
    const attributionRequired = metadata.AttributionRequired?.value?.toLowerCase() === 'true';
    return {
        provider: 'wikimedia',
        kind,
        id: String(page.pageid),
        title,
        creator,
        duration: info.duration,
        width: info.width,
        height: info.height,
        orientation: orientation(info.width, info.height),
        mimeType: info.mime,
        fileSize: info.size,
        license,
        licenseUrl: plainText(metadata.LicenseUrl?.value),
        attribution: `${title}${creator ? ` — ${creator}` : ''} — ${license}`,
        tags: title.replace(/\.[a-z0-9]{2,6}$/i, '').split(/[^\p{L}\p{N}]+/u).filter(Boolean),
        downloadUrl: info.url,
        previewUrl: info.thumburl,
        landingUrl: info.descriptionurl,
        selectable: decision.selectable && Boolean(info.url),
        requiresAttribution: decision.requiresAttribution || attributionRequired,
        requiresShareAlike: decision.requiresShareAlike,
        licenseReason: decision.reason,
    };
}
function searchUrl(query, kind, pageSize) {
    const url = new URL(API);
    const search = kind === 'video' ? `${query} filetype:video` : `${query} -filetype:video -filetype:audio`;
    const parameters = {
        action: 'query',
        format: 'json',
        formatversion: '2',
        generator: 'search',
        gsrsearch: search,
        gsrnamespace: '6',
        gsrlimit: String(Math.min(50, Math.max(1, pageSize * 3))),
        prop: 'imageinfo',
        iiprop: 'url|size|mime|mediatype|extmetadata',
        iiurlwidth: '720',
        iiextmetadatafilter: METADATA_FILTER,
        iiextmetadatalanguage: 'en',
        origin: '*',
    };
    for (const [key, value] of Object.entries(parameters))
        url.searchParams.set(key, value);
    return url;
}
async function searchWikimedia(options) {
    const payload = await apiJson(searchUrl(options.query, options.media, options.pageSize ?? 12));
    return (payload.query?.pages ?? [])
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .map((page) => normalize(page, options.includeShareAlike))
        .filter((result) => Boolean(result?.selectable))
        .slice(0, options.pageSize ?? 12);
}
export async function searchWikimediaVideos(options) {
    const results = await searchWikimedia({ query: options.query, media: 'video', pageSize: options.pageSize, includeShareAlike: options.includeShareAlike });
    return results.filter((result) => result.kind === 'video'
        && (options.minDuration === undefined || (result.duration ?? 0) >= options.minDuration)
        && (options.maxDuration === undefined || (result.duration ?? Infinity) <= options.maxDuration)
        && (options.minWidth === undefined || (result.width ?? 0) >= options.minWidth)
        && (options.minHeight === undefined || (result.height ?? 0) >= options.minHeight)
        && (options.orientation === undefined || result.orientation === options.orientation));
}
export async function searchWikimediaAssets(options) {
    const results = await searchWikimedia({ query: options.query, media: 'asset', pageSize: options.pageSize, includeShareAlike: options.includeShareAlike });
    return results.filter((result) => result.kind !== 'video'
        && (options.kind === undefined || options.kind === 'all' || result.kind === options.kind)
        && (options.minWidth === undefined || (result.width ?? 0) >= options.minWidth)
        && (options.minHeight === undefined || (result.height ?? 0) >= options.minHeight)
        && (options.orientation === undefined || result.orientation === options.orientation));
}
async function wikimediaById(id) {
    const url = new URL(API);
    const parameters = {
        action: 'query',
        format: 'json',
        formatversion: '2',
        prop: 'imageinfo',
        iiprop: 'url|size|mime|mediatype|extmetadata',
        iiurlwidth: '720',
        iiextmetadatafilter: METADATA_FILTER,
        iiextmetadatalanguage: 'en',
        pageids: id,
        origin: '*',
    };
    for (const [key, value] of Object.entries(parameters))
        url.searchParams.set(key, value);
    const payload = await apiJson(url);
    const page = payload.query?.pages?.[0];
    if (!page)
        throw new Error(`Wikimedia Commons media ${id} was not found`);
    return page;
}
export async function downloadWikimediaMedia(id, outputDir, options = {}) {
    const result = normalize(await wikimediaById(id), options.includeShareAlike);
    if (!result)
        throw new Error(`Wikimedia Commons media ${id} has no supported downloadable file`);
    return downloadFreeMedia(result, outputDir, { userAgent: USER_AGENT });
}
//# sourceMappingURL=wikimedia.js.map