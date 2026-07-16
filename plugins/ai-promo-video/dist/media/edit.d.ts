import { z } from 'zod';
export declare const ImageEditSchema: z.ZodObject<{
    input: z.ZodString;
    output: z.ZodString;
    crop: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>>;
    resize: z.ZodOptional<z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        fit: z.ZodDefault<z.ZodEnum<{
            contain: "contain";
            cover: "cover";
            stretch: "stretch";
        }>>;
        background: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    color: z.ZodOptional<z.ZodObject<{
        brightness: z.ZodDefault<z.ZodNumber>;
        contrast: z.ZodDefault<z.ZodNumber>;
        saturation: z.ZodDefault<z.ZodNumber>;
        gamma: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    blur: z.ZodOptional<z.ZodNumber>;
    removeColor: z.ZodOptional<z.ZodObject<{
        color: z.ZodDefault<z.ZodString>;
        similarity: z.ZodDefault<z.ZodNumber>;
        blend: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const VideoEditSchema: z.ZodObject<{
    input: z.ZodString;
    output: z.ZodString;
    start: z.ZodOptional<z.ZodNumber>;
    end: z.ZodOptional<z.ZodNumber>;
    speed: z.ZodDefault<z.ZodNumber>;
    crop: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>>;
    resize: z.ZodOptional<z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        fit: z.ZodDefault<z.ZodEnum<{
            contain: "contain";
            cover: "cover";
            stretch: "stretch";
        }>>;
        background: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    color: z.ZodOptional<z.ZodObject<{
        brightness: z.ZodDefault<z.ZodNumber>;
        contrast: z.ZodDefault<z.ZodNumber>;
        saturation: z.ZodDefault<z.ZodNumber>;
        gamma: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    blur: z.ZodOptional<z.ZodNumber>;
    fadeIn: z.ZodDefault<z.ZodNumber>;
    fadeOut: z.ZodDefault<z.ZodNumber>;
    volume: z.ZodDefault<z.ZodNumber>;
    mute: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ReplaceVideoRangeSchema: z.ZodObject<{
    original: z.ZodString;
    replacement: z.ZodString;
    output: z.ZodString;
    start: z.ZodNumber;
    end: z.ZodNumber;
}, z.core.$strip>;
export declare const MixMusicSchema: z.ZodObject<{
    inputVideo: z.ZodString;
    music: z.ZodString;
    output: z.ZodString;
    baseVolume: z.ZodDefault<z.ZodNumber>;
    sourceOffset: z.ZodDefault<z.ZodNumber>;
    loop: z.ZodDefault<z.ZodBoolean>;
    preserveOriginalAudio: z.ZodDefault<z.ZodBoolean>;
    originalVolume: z.ZodDefault<z.ZodNumber>;
    envelope: z.ZodDefault<z.ZodArray<z.ZodObject<{
        time: z.ZodNumber;
        volume: z.ZodNumber;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type ImageEditOptions = z.infer<typeof ImageEditSchema>;
export type VideoEditOptions = z.infer<typeof VideoEditSchema>;
export type ReplaceVideoRangeOptions = z.infer<typeof ReplaceVideoRangeSchema>;
export type MixMusicOptions = z.input<typeof MixMusicSchema>;
/** Build a frame-evaluated, piecewise-linear FFmpeg gain expression. */
export declare function musicEnvelopeExpression(points: Array<{
    time: number;
    volume: number;
}>): string;
export declare function editImage(value: ImageEditOptions): Promise<{
    outputPath: string;
    filters: string[];
}>;
export declare function editVideo(value: VideoEditOptions): Promise<{
    outputPath: string;
    duration: number;
    filters: {
        video: string[];
        audio: string[];
    };
}>;
export declare function replaceVideoRange(value: ReplaceVideoRangeOptions): Promise<{
    outputPath: string;
    duration: number;
    replaced: [number, number];
}>;
export declare function mixMusic(value: MixMusicOptions): Promise<{
    outputPath: string;
    duration: number;
    envelope: Array<{
        time: number;
        volume: number;
    }>;
    preservedOriginalAudio: boolean;
}>;
