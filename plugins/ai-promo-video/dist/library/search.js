import { searchLocalAssets, searchLocalVideos } from './local.js';
import { downloadOpenverseAsset, searchOpenverseAssets } from './openverse.js';
import { downloadWikimediaMedia, searchWikimediaAssets, searchWikimediaVideos } from './wikimedia.js';
import { downloadPexelsPhoto, downloadPexelsVideo, searchPexelsPhotos, searchPexelsVideos } from './pexels.js';
export async function searchFreeVideos(options = {}) {
    const provider = options.provider ?? 'all';
    const tasks = [];
    if (provider === 'all' || provider === 'local') {
        tasks.push(searchLocalVideos({
            query: options.query,
            directories: options.localDirectories,
            orientation: options.orientation,
            minDuration: options.minDuration,
            maxDuration: options.maxDuration,
            minWidth: options.minWidth,
            minHeight: options.minHeight,
            includeShareAlike: options.includeShareAlike,
            allowUnknownLicense: options.allowUnknownLocalLicense,
        }));
    }
    if (provider === 'all' || provider === 'wikimedia') {
        if (!options.query) {
            if (provider === 'wikimedia')
                throw new Error('Wikimedia video search requires a query');
        }
        else {
            tasks.push(searchWikimediaVideos({
                query: options.query,
                orientation: options.orientation,
                minDuration: options.minDuration,
                maxDuration: options.maxDuration,
                minWidth: options.minWidth,
                minHeight: options.minHeight,
                pageSize: options.pageSize,
                includeShareAlike: options.includeShareAlike,
            }));
        }
    }
    if (provider === 'pexels' || (provider === 'all' && Boolean(process.env.PEXELS_API_KEY))) {
        if (!options.query) {
            if (provider === 'pexels')
                throw new Error('Pexels video search requires a query');
        }
        else {
            tasks.push(searchPexelsVideos({
                query: options.query,
                orientation: options.orientation,
                minDuration: options.minDuration,
                maxDuration: options.maxDuration,
                minWidth: options.minWidth,
                minHeight: options.minHeight,
                pageSize: options.pageSize,
                locale: options.pexelsLocale,
            }));
        }
    }
    return (await Promise.all(tasks)).flat();
}
export async function searchFreeAssets(options = {}) {
    const provider = options.provider ?? 'all';
    const tasks = [];
    if (provider === 'all' || provider === 'local') {
        tasks.push(searchLocalAssets({
            query: options.query,
            directories: options.localDirectories,
            kind: options.kind,
            orientation: options.orientation,
            minWidth: options.minWidth,
            minHeight: options.minHeight,
            includeShareAlike: options.includeShareAlike,
            allowUnknownLicense: options.allowUnknownLocalLicense,
        }));
    }
    if (provider === 'all' || provider === 'openverse') {
        if (!options.query) {
            if (provider === 'openverse')
                throw new Error('Openverse asset search requires a query');
        }
        else {
            tasks.push(searchOpenverseAssets({
                query: options.query,
                kind: options.kind,
                orientation: options.orientation,
                minWidth: options.minWidth,
                minHeight: options.minHeight,
                pageSize: options.pageSize,
                source: options.openverseSource,
                includeShareAlike: options.includeShareAlike,
            }));
        }
    }
    if (provider === 'all' || provider === 'wikimedia') {
        if (!options.query) {
            if (provider === 'wikimedia')
                throw new Error('Wikimedia asset search requires a query');
        }
        else {
            tasks.push(searchWikimediaAssets({
                query: options.query,
                kind: options.kind,
                orientation: options.orientation,
                minWidth: options.minWidth,
                minHeight: options.minHeight,
                pageSize: options.pageSize,
                includeShareAlike: options.includeShareAlike,
            }));
        }
    }
    if (provider === 'pexels' || (provider === 'all' && Boolean(process.env.PEXELS_API_KEY))) {
        if (!options.query) {
            if (provider === 'pexels')
                throw new Error('Pexels asset search requires a query');
        }
        else if (options.kind === undefined || options.kind === 'all' || options.kind === 'image') {
            tasks.push(searchPexelsPhotos({
                query: options.query,
                orientation: options.orientation,
                minWidth: options.minWidth,
                minHeight: options.minHeight,
                pageSize: options.pageSize,
                locale: options.pexelsLocale,
            }));
        }
    }
    return (await Promise.all(tasks)).flat();
}
export function downloadFreeVideo(provider, id, outputDir, options = {}) {
    return provider === 'pexels' ? downloadPexelsVideo(id, outputDir) : downloadWikimediaMedia(id, outputDir, options);
}
export function downloadFreeAsset(provider, id, outputDir, options = {}) {
    return provider === 'openverse'
        ? downloadOpenverseAsset(id, outputDir, options)
        : provider === 'pexels'
            ? downloadPexelsPhoto(id, outputDir)
            : downloadWikimediaMedia(id, outputDir, options);
}
//# sourceMappingURL=search.js.map