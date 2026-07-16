import type { MusicSearchResult } from '../types.js';
export declare function searchLocalMusic(options?: {
    query?: string;
    directories?: string[];
    includeBundled?: boolean;
    allowUnknownLicense?: boolean;
    minDuration?: number;
    maxDuration?: number;
}): Promise<MusicSearchResult[]>;
