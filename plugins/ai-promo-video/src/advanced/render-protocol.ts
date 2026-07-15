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

export type AdvancedRenderWorkerMessage =
  | { type: 'ready' }
  | { type: 'progress'; update: RenderProgressUpdate }
  | { type: 'complete'; outputPath: string }
  | { type: 'error'; message: string; stack?: string };

export function aggregateWorkerProgress(values: ReadonlyMap<number, number>, workers: number): number {
  if (!Number.isInteger(workers) || workers < 1) throw new Error('workers must be a positive integer');
  let total = 0;
  for (let worker = 0; worker < workers; worker += 1) {
    total += Math.min(1, Math.max(0, values.get(worker) ?? 0));
  }
  return total / workers;
}
