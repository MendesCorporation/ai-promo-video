import type { FreeMediaSearchResult, MediaOrientation } from '../types.js';
export declare function searchOpenverseAssets(options: {
    query: string;
    kind?: 'all' | 'image' | 'svg' | 'animation';
    orientation?: MediaOrientation;
    source?: string;
    pageSize?: number;
    minWidth?: number;
    minHeight?: number;
    includeShareAlike?: boolean;
}): Promise<FreeMediaSearchResult[]>;
export declare function downloadOpenverseAsset(id: string, outputDir: string, options?: {
    includeShareAlike?: boolean;
}): Promise<FreeMediaSearchResult>;
