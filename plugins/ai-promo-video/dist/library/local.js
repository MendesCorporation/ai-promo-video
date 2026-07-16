import { access, readdir, readFile, stat } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import ffprobeStatic from 'ffprobe-static';
import { runCommand } from '../utils/process.js';
import { assessFreeLicense, orientation } from './license.js';
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv', '.ogv', '.avi']);
const ASSET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);
const MIME_TYPES = {
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/x-m4v', '.mkv': 'video/x-matroska', '.ogv': 'video/ogg', '.avi': 'video/x-msvideo',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.svg': 'image/svg+xml',
};
async function walk(directory, extensions, limit = 5000) {
    const output = [];
    async function visit(current) {
        if (output.length >= limit)
            return;
        const entries = await readdir(current, { withFileTypes: true });
        for (const entry of entries) {
            if (output.length >= limit)
                return;
            const path = join(current, entry.name);
            if (entry.isDirectory())
                await visit(path);
            else if (extensions.has(extname(entry.name).toLowerCase()))
                output.push(path);
        }
    }
    await visit(directory);
    return output;
}
async function sidecar(path) {
    for (const candidate of [`${path}.json`, join(path, '..', `${basename(path, extname(path))}.json`)]) {
        try {
            await access(candidate);
            return JSON.parse(await readFile(candidate, 'utf8'));
        }
        catch {
            // Sidecar metadata is optional.
        }
    }
    return {};
}
async function probe(path) {
    if (extname(path).toLowerCase() === '.svg')
        return {};
    try {
        const result = await runCommand(ffprobeStatic.path, [
            '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,duration:format=duration', '-of', 'json', path,
        ], { quiet: true });
        const value = JSON.parse(result.stdout);
        const stream = value.streams?.[0];
        const duration = Number(stream?.duration ?? value.format?.duration);
        return { width: stream?.width, height: stream?.height, duration: Number.isFinite(duration) ? duration : undefined };
    }
    catch {
        return {};
    }
}
function kind(path) {
    const extension = extname(path).toLowerCase();
    if (VIDEO_EXTENSIONS.has(extension))
        return 'video';
    if (extension === '.svg')
        return 'svg';
    if (extension === '.gif')
        return 'animation';
    return 'image';
}
function matches(result, query) {
    if (!query)
        return true;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const haystack = `${result.title} ${result.creator ?? ''} ${result.tags.join(' ')}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
}
async function localResult(path, includeShareAlike, allowUnknownLicense) {
    const metadata = await sidecar(path);
    const details = await probe(path);
    const license = String(metadata.license ?? 'unknown');
    const decision = assessFreeLicense(license, { includeShareAlike });
    const isUnknownOverride = allowUnknownLicense && license.toLowerCase() === 'unknown';
    const mediaKind = kind(path);
    const file = await stat(path);
    const title = String(metadata.title ?? basename(path, extname(path)));
    const creator = metadata.creator ? String(metadata.creator) : undefined;
    return {
        provider: 'local',
        kind: mediaKind,
        id: path,
        title,
        creator,
        duration: typeof metadata.duration === 'number' ? metadata.duration : details.duration,
        width: typeof metadata.width === 'number' ? metadata.width : details.width,
        height: typeof metadata.height === 'number' ? metadata.height : details.height,
        orientation: orientation(typeof metadata.width === 'number' ? metadata.width : details.width, typeof metadata.height === 'number' ? metadata.height : details.height),
        mimeType: MIME_TYPES[extname(path).toLowerCase()],
        fileSize: file.size,
        license,
        licenseUrl: metadata.licenseUrl ? String(metadata.licenseUrl) : undefined,
        attribution: metadata.attribution ? String(metadata.attribution) : (creator ? `${title} — ${creator} — ${license}` : undefined),
        tags: Array.isArray(metadata.tags) ? metadata.tags.map(String) : basename(path, extname(path)).split(/[-_ ]+/).filter(Boolean),
        localPath: path,
        previewUrl: path,
        selectable: decision.selectable || isUnknownOverride,
        requiresAttribution: decision.requiresAttribution,
        requiresShareAlike: decision.requiresShareAlike,
        licenseReason: isUnknownOverride ? 'Unknown local license explicitly allowed by the caller.' : decision.reason,
    };
}
async function searchLocal(options) {
    const extensions = options.media === 'video' ? VIDEO_EXTENSIONS : ASSET_EXTENSIONS;
    const paths = new Set();
    for (const directory of options.directories ?? []) {
        for (const path of await walk(resolve(directory), extensions).catch(() => []))
            paths.add(path);
    }
    const results = await Promise.all([...paths].map((path) => localResult(path, options.includeShareAlike === true, options.allowUnknownLicense === true)));
    return results.filter((result) => result.selectable
        && matches(result, options.query)
        && (options.media === 'video' ? result.kind === 'video' : result.kind !== 'video')
        && (options.kind === undefined || options.kind === 'all' || result.kind === options.kind)
        && (options.orientation === undefined || result.orientation === options.orientation)
        && (options.minDuration === undefined || (result.duration ?? 0) >= options.minDuration)
        && (options.maxDuration === undefined || (result.duration ?? Infinity) <= options.maxDuration)
        && (options.minWidth === undefined || (result.width ?? 0) >= options.minWidth)
        && (options.minHeight === undefined || (result.height ?? 0) >= options.minHeight));
}
export function searchLocalVideos(options = {}) {
    return searchLocal({ ...options, media: 'video' });
}
export function searchLocalAssets(options = {}) {
    return searchLocal({ ...options, media: 'asset' });
}
//# sourceMappingURL=local.js.map