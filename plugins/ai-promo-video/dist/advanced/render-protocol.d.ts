export type RenderPhase = 'starting' | 'rendering' | 'encoding' | 'complete';
export interface RenderProgressUpdate {
    phase: RenderPhase;
    progress: number;
    message: string;
    worker?: number;
    workers?: number;
}
export interface AdvancedRenderWorkerOptions {
    projectFile: string;
    output: string;
    variables?: Record<string, unknown>;
    workers: number;
    width?: number;
    height?: number;
    rangeStart?: number;
    rangeEnd?: number;
}
export type AdvancedRenderParentMessage = {
    type: 'render';
    options: AdvancedRenderWorkerOptions;
};
export type AdvancedRenderWorkerMessage = {
    type: 'ready';
} | {
    type: 'progress';
    update: RenderProgressUpdate;
} | {
    type: 'complete';
    outputPath: string;
} | {
    type: 'error';
    message: string;
    stack?: string;
};
export declare function aggregateWorkerProgress(values: ReadonlyMap<number, number>, workers: number): number;
