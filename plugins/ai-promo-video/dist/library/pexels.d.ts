import type { FreeMediaSearchResult, MediaOrientation } from '../types.js';
interface PexelsUser {
    name: string;
    url?: string;
}
interface PexelsVideoFile {
    id: number;
    quality?: string;
    file_type?: string;
    width?: number;
    height?: number;
    link: string;
}
interface PexelsVideo {
    id: number;
    width: number;
    height: number;
    duration: number;
    url: string;
    image?: string;
    user: PexelsUser;
    video_files: PexelsVideoFile[];
}
interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url?: string;
    alt?: string;
    src: {
        original: string;
        large2x?: string;
        large?: string;
        medium?: string;
    };
}
export declare function normalizePexelsVideo(video: PexelsVideo): FreeMediaSearchResult;
export declare function normalizePexelsPhoto(photo: PexelsPhoto): FreeMediaSearchResult;
export declare function searchPexelsVideos(options: {
    query: string;
    orientation?: MediaOrientation;
    minDuration?: number;
    maxDuration?: number;
    minWidth?: number;
    minHeight?: number;
    pageSize?: number;
    locale?: string;
    apiKey?: string;
}): Promise<FreeMediaSearchResult[]>;
export declare function searchPexelsPhotos(options: {
    query: string;
    orientation?: MediaOrientation;
    minWidth?: number;
    minHeight?: number;
    pageSize?: number;
    locale?: string;
    apiKey?: string;
}): Promise<FreeMediaSearchResult[]>;
export declare function downloadPexelsVideo(id: string, outputDir: string, apiKey?: string): Promise<FreeMediaSearchResult>;
export declare function downloadPexelsPhoto(id: string, outputDir: string, apiKey?: string): Promise<FreeMediaSearchResult>;
export {};
