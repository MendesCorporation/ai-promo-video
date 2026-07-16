export declare const motionComponentCategories: readonly ["background", "format", "layout", "caption", "typography", "product", "shape", "transition", "camera", "cursor", "particle", "effect"];
export type MotionComponentCategory = typeof motionComponentCategories[number];
export type MotionEnergy = 'quiet' | 'measured' | 'energetic' | 'impact';
export interface MotionComponent {
    id: string;
    title: string;
    category: MotionComponentCategory;
    summary: string;
    tags: string[];
    moods: string[];
    energy: MotionEnergy[];
    sourceExports: string[];
    parameters: string[];
    compositionNotes: string;
}
/**
 * A vocabulary, not a template gallery. Entries intentionally describe visual
 * systems that can be combined and rewritten inside one Revideo scene.
 */
export declare const motionComponentLibrary: MotionComponent[];
export interface MotionComponentSearchOptions {
    query?: string;
    categories?: MotionComponentCategory[];
    tags?: string[];
    moods?: string[];
    energy?: MotionEnergy[];
    limit?: number;
}
export declare function searchMotionComponents(options?: MotionComponentSearchOptions): MotionComponent[];
export declare const motionLibrarySummary: {
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
