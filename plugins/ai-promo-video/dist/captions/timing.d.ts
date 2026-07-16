export type CaptionTimingPrecision = 'word-exact' | 'cue-interpolated';
export type CaptionIssueSeverity = 'info' | 'warning' | 'error';
export interface CaptionWordTiming {
    text: string;
    start: number;
    end: number;
    confidence?: number;
    emphasis?: boolean;
}
export interface CaptionCueTiming {
    id: string;
    start: number;
    end: number;
    text: string;
    speaker?: string;
    precision: CaptionTimingPrecision;
    words: CaptionWordTiming[];
}
export interface CaptionIssue {
    severity: CaptionIssueSeverity;
    code: string;
    cueId?: string;
    message: string;
}
export interface CaptionTimingDocument {
    version: 1;
    source: string;
    duration: number;
    precision: CaptionTimingPrecision | 'mixed';
    cues: CaptionCueTiming[];
    qa: {
        passed: boolean;
        issues: CaptionIssue[];
        metrics: {
            cues: number;
            words: number;
            approximateWords: number;
            maxCharactersPerSecond: number;
        };
    };
}
export declare function interpolateCueWords(text: string, start: number, end: number): CaptionWordTiming[];
export declare function assessCaptionTiming(cues: CaptionCueTiming[]): CaptionTimingDocument['qa'];
export declare function prepareCaptionTiming(options: {
    inputPath: string;
    outputPath?: string;
}): Promise<CaptionTimingDocument & {
    outputPath?: string;
}>;
export declare function reviewCaptionTiming(path: string): Promise<CaptionTimingDocument['qa']>;
