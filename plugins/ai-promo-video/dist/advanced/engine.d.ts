import { type PlatformTarget, type VideoFormatId, type VideoFormatProfile } from './formats.js';
import type { RenderProgressUpdate } from './render-protocol.js';
export type { RenderPhase, RenderProgressUpdate } from './render-protocol.js';
export interface AdvancedProjectResult {
    projectDir: string;
    projectFile: string;
    sceneFile: string;
    formatProfile: VideoFormatProfile;
}
export declare const motionCapabilities: {
    engine: string;
    selectionRule: string;
    primitives: string[];
    formats: string[];
    captions: string[];
    animation: string[];
    effects: string[];
    threeD: string[];
    exampleRecipes: string[];
    componentLibrary: {
        model: string;
        count: number;
        categories: readonly ["background", "format", "layout", "caption", "typography", "product", "shape", "transition", "camera", "cursor", "particle", "effect"];
        sourceFiles: {
            components: string;
            sceneTree: string;
            typography: string;
            captions: string;
            formats: string;
            procedural: string;
            ambient: string;
            transitions: string;
            camera: string;
            vectorMotion: string;
            threeEffects: string;
            opticalGlass: string;
            opticalGlassShader: string;
            liquidGlassText: string;
            liquidGlassTextShader: string;
            catalog: string;
        };
        rule: string;
    };
    extensibility: string;
};
export declare function scaffoldAdvancedProject(options: {
    outputDir: string;
    name: string;
    format?: VideoFormatId;
    platform?: PlatformTarget;
    width?: number;
    height?: number;
    fps?: number;
}): Promise<AdvancedProjectResult>;
export declare function saveAdvancedProjectFile(projectDir: string, relativePath: string, source: string): Promise<string>;
export declare function readAdvancedProjectFile(projectDir: string, relativePath: string): Promise<{
    path: string;
    source: string;
}>;
export declare function listAdvancedProjectFiles(projectDir: string): Promise<{
    projectDir: string;
    files: string[];
}>;
export declare function patchAdvancedProjectFile(projectDir: string, relativePath: string, patches: Array<{
    find: string;
    replace: string;
}>): Promise<{
    path: string;
    patchesApplied: number;
}>;
export declare function renderAdvancedProject(options: {
    projectFile: string;
    output: string;
    variables?: Record<string, unknown>;
    workers?: number;
    width?: number;
    height?: number;
    rangeStart?: number;
    rangeEnd?: number;
    onProgress?: (update: RenderProgressUpdate) => void | Promise<void>;
    signal?: AbortSignal;
    startupTimeoutMs?: number;
    stallTimeoutMs?: number;
    maxRenderTimeMs?: number;
}): Promise<{
    outputPath: string;
    engine: string;
}>;
