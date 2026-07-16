import { z } from 'zod';
export declare const TransitionSchema: z.ZodEnum<{
    fade: "fade";
    push: "push";
    wipe: "wipe";
    zoom: "zoom";
}>;
export type Transition = z.infer<typeof TransitionSchema>;
export declare const FocusSchema: z.ZodObject<{
    x: z.ZodDefault<z.ZodNumber>;
    y: z.ZodDefault<z.ZodNumber>;
    scale: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const SceneSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        hero: "hero";
        product: "product";
        features: "features";
        metrics: "metrics";
        cta: "cta";
    }>;
    duration: z.ZodNumber;
    eyebrow: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    subtitle: z.ZodOptional<z.ZodString>;
    media: z.ZodOptional<z.ZodString>;
    transition: z.ZodDefault<z.ZodEnum<{
        fade: "fade";
        push: "push";
        wipe: "wipe";
        zoom: "zoom";
    }>>;
    focus: z.ZodOptional<z.ZodObject<{
        x: z.ZodDefault<z.ZodNumber>;
        y: z.ZodDefault<z.ZodNumber>;
        scale: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    bullets: z.ZodOptional<z.ZodArray<z.ZodString>>;
    metrics: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>>;
    badge: z.ZodOptional<z.ZodString>;
    align: z.ZodDefault<z.ZodEnum<{
        left: "left";
        center: "center";
    }>>;
}, z.core.$strip>;
export declare const VideoSpecSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    id: z.ZodString;
    title: z.ZodString;
    width: z.ZodDefault<z.ZodNumber>;
    height: z.ZodDefault<z.ZodNumber>;
    fps: z.ZodDefault<z.ZodNumber>;
    duration: z.ZodNumber;
    brand: z.ZodObject<{
        name: z.ZodString;
        logo: z.ZodOptional<z.ZodString>;
        accent: z.ZodDefault<z.ZodString>;
        accent2: z.ZodDefault<z.ZodString>;
        background: z.ZodDefault<z.ZodString>;
        foreground: z.ZodDefault<z.ZodString>;
        fontFamily: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    scenes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<{
            hero: "hero";
            product: "product";
            features: "features";
            metrics: "metrics";
            cta: "cta";
        }>;
        duration: z.ZodNumber;
        eyebrow: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
        subtitle: z.ZodOptional<z.ZodString>;
        media: z.ZodOptional<z.ZodString>;
        transition: z.ZodDefault<z.ZodEnum<{
            fade: "fade";
            push: "push";
            wipe: "wipe";
            zoom: "zoom";
        }>>;
        focus: z.ZodOptional<z.ZodObject<{
            x: z.ZodDefault<z.ZodNumber>;
            y: z.ZodDefault<z.ZodNumber>;
            scale: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>;
        bullets: z.ZodOptional<z.ZodArray<z.ZodString>>;
        metrics: z.ZodOptional<z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            value: z.ZodString;
        }, z.core.$strip>>>;
        badge: z.ZodOptional<z.ZodString>;
        align: z.ZodDefault<z.ZodEnum<{
            left: "left";
            center: "center";
        }>>;
    }, z.core.$strip>>;
    music: z.ZodOptional<z.ZodObject<{
        track: z.ZodString;
        volume: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    output: z.ZodString;
}, z.core.$strip>;
export type Scene = z.infer<typeof SceneSchema>;
export type VideoSpec = z.infer<typeof VideoSpecSchema>;
export declare const BrowserActionSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"click">;
    selector: z.ZodString;
    delayMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"fill">;
    selector: z.ZodString;
    value: z.ZodString;
    delayMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"press">;
    selector: z.ZodString;
    key: z.ZodString;
    delayMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"hover">;
    selector: z.ZodString;
    delayMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"select">;
    selector: z.ZodString;
    value: z.ZodString;
    delayMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"check">;
    selector: z.ZodString;
    checked: z.ZodDefault<z.ZodBoolean>;
    delayMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"scroll">;
    deltaX: z.ZodDefault<z.ZodNumber>;
    deltaY: z.ZodNumber;
    delayMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"mouse">;
    x: z.ZodNumber;
    y: z.ZodNumber;
    steps: z.ZodDefault<z.ZodNumber>;
    delayMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"goto">;
    url: z.ZodString;
    delayMs: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"wait">;
    ms: z.ZodNumber;
}, z.core.$strip>], "type">;
export declare const CaptureSpecSchema: z.ZodObject<{
    baseUrl: z.ZodString;
    outputDir: z.ZodString;
    viewport: z.ZodDefault<z.ZodObject<{
        width: z.ZodDefault<z.ZodNumber>;
        height: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    auth: z.ZodOptional<z.ZodObject<{
        path: z.ZodDefault<z.ZodString>;
        fields: z.ZodArray<z.ZodObject<{
            selector: z.ZodString;
            value: z.ZodString;
        }, z.core.$strip>>;
        submit: z.ZodString;
        waitForUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    targets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        path: z.ZodString;
        waitFor: z.ZodOptional<z.ZodString>;
        delayMs: z.ZodDefault<z.ZodNumber>;
        actions: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"click">;
            selector: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"fill">;
            selector: z.ZodString;
            value: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"press">;
            selector: z.ZodString;
            key: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"hover">;
            selector: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"select">;
            selector: z.ZodString;
            value: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"check">;
            selector: z.ZodString;
            checked: z.ZodDefault<z.ZodBoolean>;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"scroll">;
            deltaX: z.ZodDefault<z.ZodNumber>;
            deltaY: z.ZodNumber;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"mouse">;
            x: z.ZodNumber;
            y: z.ZodNumber;
            steps: z.ZodDefault<z.ZodNumber>;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"goto">;
            url: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"wait">;
            ms: z.ZodNumber;
        }, z.core.$strip>], "type">>>;
        fullPage: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    recordings: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        path: z.ZodString;
        waitFor: z.ZodOptional<z.ZodString>;
        settleMs: z.ZodDefault<z.ZodNumber>;
        preRollMs: z.ZodDefault<z.ZodNumber>;
        postRollMs: z.ZodDefault<z.ZodNumber>;
        actions: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"click">;
            selector: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"fill">;
            selector: z.ZodString;
            value: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"press">;
            selector: z.ZodString;
            key: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"hover">;
            selector: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"select">;
            selector: z.ZodString;
            value: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"check">;
            selector: z.ZodString;
            checked: z.ZodDefault<z.ZodBoolean>;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"scroll">;
            deltaX: z.ZodDefault<z.ZodNumber>;
            deltaY: z.ZodNumber;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"mouse">;
            x: z.ZodNumber;
            y: z.ZodNumber;
            steps: z.ZodDefault<z.ZodNumber>;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"goto">;
            url: z.ZodString;
            delayMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"wait">;
            ms: z.ZodNumber;
        }, z.core.$strip>], "type">>;
        pointer: z.ZodDefault<z.ZodEnum<{
            hidden: "hidden";
            annotated: "annotated";
        }>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type CaptureSpec = z.infer<typeof CaptureSpecSchema>;
export type BrowserAction = z.infer<typeof BrowserActionSchema>;
export interface AudioTrack {
    id: string;
    title: string;
    file: string;
    bpm: number;
    mood: string[];
    intensity: number;
    loopable: boolean;
    license: 'CC0-1.0';
}
export interface MusicSearchResult {
    provider: 'bundled' | 'local' | 'openverse';
    id: string;
    title: string;
    creator?: string;
    duration?: number;
    license: string;
    licenseUrl?: string;
    attribution?: string;
    tags: string[];
    localPath?: string;
    downloadUrl?: string;
    landingUrl?: string;
    selectable: boolean;
}
export type FreeMediaKind = 'video' | 'image' | 'svg' | 'animation';
export type FreeMediaProvider = 'local' | 'openverse' | 'wikimedia' | 'pexels';
export type MediaOrientation = 'landscape' | 'portrait' | 'square';
export interface FreeMediaSearchResult {
    provider: FreeMediaProvider;
    kind: FreeMediaKind;
    id: string;
    title: string;
    creator?: string;
    duration?: number;
    width?: number;
    height?: number;
    orientation?: MediaOrientation;
    mimeType?: string;
    fileSize?: number;
    license: string;
    licenseUrl?: string;
    attribution?: string;
    tags: string[];
    localPath?: string;
    downloadUrl?: string;
    previewUrl?: string;
    landingUrl?: string;
    selectable: boolean;
    requiresAttribution: boolean;
    requiresShareAlike: boolean;
    licenseReason?: string;
}
export interface RenderResult {
    outputPath: string;
    duration: number;
    frames: number;
    width: number;
    height: number;
    fps: number;
    audioTrack?: string;
}
