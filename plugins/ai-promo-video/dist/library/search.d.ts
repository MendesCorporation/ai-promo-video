import type { FreeMediaSearchResult, MediaOrientation } from '../types.js';
export type VideoSearchProvider = 'all' | 'local' | 'wikimedia' | 'pexels';
export type AssetSearchProvider = 'all' | 'local' | 'openverse' | 'wikimedia' | 'pexels';
export declare function searchFreeVideos(options?: {
    query?: string;
    provider?: VideoSearchProvider;
    localDirectories?: string[];
    orientation?: MediaOrientation;
    minDuration?: number;
    maxDuration?: number;
    minWidth?: number;
    minHeight?: number;
    pageSize?: number;
    pexelsLocale?: string;
    includeShareAlike?: boolean;
    allowUnknownLocalLicense?: boolean;
}): Promise<FreeMediaSearchResult[]>;
export declare function searchFreeAssets(options?: {
    query?: string;
    provider?: AssetSearchProvider;
    localDirectories?: string[];
    kind?: 'all' | 'image' | 'svg' | 'animation';
    orientation?: MediaOrientation;
    minWidth?: number;
    minHeight?: number;
    pageSize?: number;
    openverseSource?: string;
    pexelsLocale?: string;
    includeShareAlike?: boolean;
    allowUnknownLocalLicense?: boolean;
}): Promise<FreeMediaSearchResult[]>;
export declare function downloadFreeVideo(provider: 'wikimedia' | 'pexels', id: string, outputDir: string, options?: {
    includeShareAlike?: boolean;
}): Promise<FreeMediaSearchResult>;
export declare function downloadFreeAsset(provider: 'openverse' | 'wikimedia' | 'pexels', id: string, outputDir: string, options?: {
    includeShareAlike?: boolean;
}): Promise<FreeMediaSearchResult>;
