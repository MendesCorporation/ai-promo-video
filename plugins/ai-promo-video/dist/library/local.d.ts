import type { FreeMediaSearchResult, MediaOrientation } from '../types.js';
export declare function searchLocalVideos(options?: {
    directories?: string[];
    query?: string;
    orientation?: MediaOrientation;
    minDuration?: number;
    maxDuration?: number;
    minWidth?: number;
    minHeight?: number;
    includeShareAlike?: boolean;
    allowUnknownLicense?: boolean;
}): Promise<FreeMediaSearchResult[]>;
export declare function searchLocalAssets(options?: {
    directories?: string[];
    query?: string;
    kind?: 'all' | 'image' | 'svg' | 'animation';
    orientation?: MediaOrientation;
    minWidth?: number;
    minHeight?: number;
    includeShareAlike?: boolean;
    allowUnknownLicense?: boolean;
}): Promise<FreeMediaSearchResult[]>;
