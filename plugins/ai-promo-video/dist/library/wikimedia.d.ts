import type { FreeMediaSearchResult, MediaOrientation } from '../types.js';
export declare function searchWikimediaVideos(options: {
    query: string;
    pageSize?: number;
    minDuration?: number;
    maxDuration?: number;
    minWidth?: number;
    minHeight?: number;
    orientation?: MediaOrientation;
    includeShareAlike?: boolean;
}): Promise<FreeMediaSearchResult[]>;
export declare function searchWikimediaAssets(options: {
    query: string;
    kind?: 'all' | 'image' | 'svg' | 'animation';
    pageSize?: number;
    minWidth?: number;
    minHeight?: number;
    orientation?: MediaOrientation;
    includeShareAlike?: boolean;
}): Promise<FreeMediaSearchResult[]>;
export declare function downloadWikimediaMedia(id: string, outputDir: string, options?: {
    includeShareAlike?: boolean;
}): Promise<FreeMediaSearchResult>;
