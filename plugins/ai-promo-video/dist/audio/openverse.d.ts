import type { MusicSearchResult } from '../types.js';
export declare function searchOpenverseMusic(options: {
    query: string;
    licenses?: Array<'cc0' | 'pdm' | 'by'>;
    source?: string;
    pageSize?: number;
    minDuration?: number;
    maxDuration?: number;
}): Promise<MusicSearchResult[]>;
export declare function downloadOpenverseMusic(id: string, outputDir: string): Promise<MusicSearchResult>;
