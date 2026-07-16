import { type CaptureSpec } from '../types.js';
export interface CaptureResult {
    outputDir: string;
    captures: Array<{
        id: string;
        path: string;
        url: string;
        title: string;
    }>;
    recordings: Array<{
        id: string;
        path: string;
        url: string;
        title: string;
        duration: number;
        width: number;
        height: number;
        fps: number;
    }>;
}
export declare function captureSite(spec: CaptureSpec, sourcePath: string, modes?: {
    screenshots?: boolean;
    recordings?: boolean;
}): Promise<CaptureResult>;
export declare function captureFromSpecFile(path: string): Promise<CaptureResult>;
export declare function recordFromSpecFile(path: string): Promise<CaptureResult>;
export declare function inspectSite(url: string, outputPath?: string): Promise<Record<string, unknown>>;
