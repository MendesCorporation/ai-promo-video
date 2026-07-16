import { type RenderResult, type VideoSpec } from '../types.js';
interface RenderOptions {
    keepFrames?: boolean;
    workers?: number;
}
export declare function renderVideo(spec: VideoSpec, specPath: string, options?: RenderOptions): Promise<RenderResult>;
export declare function renderFromSpecFile(path: string, options?: RenderOptions): Promise<RenderResult>;
export {};
