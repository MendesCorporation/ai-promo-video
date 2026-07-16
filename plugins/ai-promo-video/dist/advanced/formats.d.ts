export declare const videoFormatIds: readonly ["landscape", "portrait", "square"];
export declare const platformTargets: readonly ["generic", "tiktok", "instagram-reels", "youtube-shorts"];
export type VideoFormatId = typeof videoFormatIds[number];
export type PlatformTarget = typeof platformTargets[number];
export interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface VideoFormatProfile {
    id: VideoFormatId;
    width: number;
    height: number;
    aspectRatio: string;
    platform: PlatformTarget;
    safeArea: SafeAreaInsets;
    safeAreaPixels: SafeAreaInsets;
    guidance: string[];
}
export declare function inferVideoFormat(width: number, height: number): VideoFormatId;
export declare function resolveVideoFormat(options?: {
    format?: VideoFormatId;
    platform?: PlatformTarget;
    width?: number;
    height?: number;
    safeArea?: Partial<SafeAreaInsets>;
}): VideoFormatProfile;
export declare const videoFormatProfiles: VideoFormatProfile[];
