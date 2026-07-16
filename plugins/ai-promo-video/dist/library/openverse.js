import { extname } from 'node:path';
import { assessFreeLicense, orientation } from './license.js';
import { downloadFreeMedia } from './files.js';
const API = 'https://api.openverse.org/v1/images/';
const USER_AGENT = 'ai-promo-video/0.2.0 (open-source local media search)';
async function apiJson(url) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!response.ok)
        throw new Error(`Openverse image request failed (${response.status}): ${await response.text()}`);
    return response.json();
}
function kind(item) {
    const declared = item.filetype?.toLowerCase();
    if (declared === 'svg')
        return 'svg';
    if (declared === 'gif')
        return 'animation';
    if (item.url) {
        try {
            const extension = extname(new URL(item.url).pathname).toLowerCase();
            if (extension === '.svg')
                return 'svg';
            if (extension === '.gif')
                return 'animation';
        }
        catch {
            // Use the default image kind.
        }
    }
    return 'image';
}
function normalize(item, includeShareAlike = false) {
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
        tags: item.tags?.map((tag) => tag.name).filter((name) => Boolean(name)) ?? [],
        downloadUrl: item.url,
        previewUrl: item.thumbnail,
        landingUrl: item.foreign_landing_url,
        selectable: decision.selectable && Boolean(item.url),
        requiresAttribution: decision.requiresAttribution,
        requiresShareAlike: decision.requiresShareAlike,
        licenseReason: decision.reason,
    };
}
export async function searchOpenverseAssets(options) {
    const url = new URL(API);
    url.searchParams.set('q', options.query);
    const licenses = ['cc0', 'pdm', 'by'];
    if (options.includeShareAlike)
        licenses.push('by-sa');
    url.searchParams.set('license', licenses.join(','));
    url.searchParams.set('page_size', String(Math.min(50, Math.max(1, options.pageSize ?? 12))));
    url.searchParams.set('mature', 'false');
    if (options.source)
        url.searchParams.set('source', options.source);
    if (options.orientation)
        url.searchParams.set('aspect_ratio', options.orientation === 'landscape' ? 'wide' : options.orientation === 'portrait' ? 'tall' : 'square');
    if (options.kind === 'svg')
        url.searchParams.set('extension', 'svg');
    if (options.kind === 'animation')
        url.searchParams.set('extension', 'gif');
    const payload = await apiJson(url.toString());
    return (payload.results ?? [])
        .map((item) => normalize(item, options.includeShareAlike))
        .filter((result) => result.selectable
        && (options.kind === undefined || options.kind === 'all' || result.kind === options.kind || (options.kind === 'image' && result.kind === 'image'))
        && (options.minWidth === undefined || (result.width ?? 0) >= options.minWidth)
        && (options.minHeight === undefined || (result.height ?? 0) >= options.minHeight));
}
export async function downloadOpenverseAsset(id, outputDir, options = {}) {
    const item = await apiJson(`${API}${encodeURIComponent(id)}/`);
    return downloadFreeMedia(normalize(item, options.includeShareAlike), outputDir, { userAgent: USER_AGENT, maxBytes: 100 * 1024 * 1024 });
}
//# sourceMappingURL=openverse.js.map