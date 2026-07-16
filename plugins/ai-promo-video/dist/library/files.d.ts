import type { FreeMediaSearchResult } from '../types.js';
export declare function downloadFreeMedia(result: FreeMediaSearchResult, outputDir: string, options: {
    userAgent: string;
    maxBytes?: number;
}): Promise<FreeMediaSearchResult>;
