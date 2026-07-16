export interface VideoProbe {
    path: string;
    duration: number;
    size: number;
    width?: number;
    height?: number;
    fps?: number;
    videoCodec?: string;
    audioCodec?: string;
    hasAudio: boolean;
}
export declare function probeVideo(path: string): Promise<VideoProbe>;
export declare function extractReviewFrames(videoPath: string, outputDir: string, times: number[]): Promise<string[]>;
export interface VisualReviewOptions {
    overviewInterval?: number;
    transitionTimes?: number[];
    transitionWindow?: number;
    transitionFps?: number;
}
export interface VisualReviewPack {
    video: VideoProbe;
    outputDir: string;
    overviewSheets: string[];
    transitionSheets: string[];
    anomalyCandidates: string[];
    checklist: string[];
    manifestPath: string;
    deliveryBlockedUntil: string;
}
export declare function createVisualReviewPack(videoPath: string, outputDir: string, options?: VisualReviewOptions): Promise<VisualReviewPack>;
