import type { AudioTrack } from '../types.js';
interface AudioCatalog {
    version: number;
    tracks: AudioTrack[];
}
export declare function audioDirectory(): string;
export declare function loadAudioCatalog(): Promise<AudioCatalog>;
export declare function listAudioTracks(filters?: {
    mood?: string;
    maxIntensity?: number;
}): Promise<AudioTrack[]>;
export declare function resolveAudioTrack(id: string, baseFile?: string): Promise<string>;
export {};
