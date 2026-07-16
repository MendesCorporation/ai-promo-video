export interface MusicEnergyPoint {
    time: number;
    energy: number;
    momentaryLufs: number;
}
export interface MusicAnalysis {
    path: string;
    duration: number;
    channels?: number;
    sampleRate?: number;
    integratedLufs?: number;
    loudnessRangeLu?: number;
    truePeakDbfs?: number;
    energyCurve: MusicEnergyPoint[];
    peakEnergyTimes: number[];
    silences: Array<{
        start: number;
        end?: number;
        duration?: number;
    }>;
    visualReview?: {
        waveform: string;
        spectrogram: string;
    };
    usage: string;
}
export declare function analyzeMusic(path: string, reviewDir?: string): Promise<MusicAnalysis>;
