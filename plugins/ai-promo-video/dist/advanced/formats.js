export const videoFormatIds = ['landscape', 'portrait', 'square'];
export const platformTargets = ['generic', 'tiktok', 'instagram-reels', 'youtube-shorts'];
const baseProfiles = {
    landscape: {
        id: 'landscape',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        guidance: ['Keep product details large enough to read.', 'Protect at least the outer five percent.'],
    },
    portrait: {
        id: 'portrait',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        guidance: ['Recompose instead of shrinking a landscape scene.', 'Reserve a movable caption lane and keep the focal subject clear of platform controls.'],
    },
    square: {
        id: 'square',
        width: 1080,
        height: 1080,
        aspectRatio: '1:1',
        guidance: ['Use shorter copy measures and a compact product crop.', 'Protect at least the outer six percent.'],
    },
};
/**
 * Conservative authoring defaults, not promises about permanent platform UI.
 * Every production may override them after checking the current publishing UI.
 */
const safeAreaDefaults = {
    landscape: {
        generic: { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
        tiktok: { top: 0.08, right: 0.12, bottom: 0.14, left: 0.06 },
        'instagram-reels': { top: 0.07, right: 0.1, bottom: 0.13, left: 0.06 },
        'youtube-shorts': { top: 0.07, right: 0.11, bottom: 0.12, left: 0.06 },
    },
    portrait: {
        generic: { top: 0.06, right: 0.08, bottom: 0.12, left: 0.08 },
        tiktok: { top: 0.1, right: 0.18, bottom: 0.22, left: 0.07 },
        'instagram-reels': { top: 0.08, right: 0.13, bottom: 0.2, left: 0.08 },
        'youtube-shorts': { top: 0.08, right: 0.15, bottom: 0.18, left: 0.08 },
    },
    square: {
        generic: { top: 0.06, right: 0.06, bottom: 0.08, left: 0.06 },
        tiktok: { top: 0.08, right: 0.14, bottom: 0.16, left: 0.07 },
        'instagram-reels': { top: 0.07, right: 0.1, bottom: 0.14, left: 0.07 },
        'youtube-shorts': { top: 0.07, right: 0.12, bottom: 0.14, left: 0.07 },
    },
};
export function inferVideoFormat(width, height) {
    const ratio = width / height;
    if (ratio > 1.2)
        return 'landscape';
    if (ratio < 0.82)
        return 'portrait';
    return 'square';
}
export function resolveVideoFormat(options = {}) {
    const inferred = options.width && options.height ? inferVideoFormat(options.width, options.height) : undefined;
    const id = options.format ?? inferred ?? 'landscape';
    const base = baseProfiles[id];
    const width = options.width ?? base.width;
    const height = options.height ?? base.height;
    const platform = options.platform ?? 'generic';
    const defaults = safeAreaDefaults[id][platform];
    const safeArea = { ...defaults, ...options.safeArea };
    for (const [side, value] of Object.entries(safeArea)) {
        if (!Number.isFinite(value) || value < 0 || value >= 0.5)
            throw new Error(`safeArea.${side} must be between 0 and 0.5`);
    }
    return {
        ...base,
        width,
        height,
        platform,
        safeArea,
        safeAreaPixels: {
            top: Math.round(height * safeArea.top),
            right: Math.round(width * safeArea.right),
            bottom: Math.round(height * safeArea.bottom),
            left: Math.round(width * safeArea.left),
        },
    };
}
export const videoFormatProfiles = videoFormatIds.map((format) => resolveVideoFormat({ format }));
//# sourceMappingURL=formats.js.map