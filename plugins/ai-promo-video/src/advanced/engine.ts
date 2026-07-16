import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fork, spawn } from 'node:child_process';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { motionComponentLibrary, motionLibrarySummary } from './library.js';
import { resolveVideoFormat, type PlatformTarget, type VideoFormatId, type VideoFormatProfile } from './formats.js';
import type { AdvancedRenderParentMessage, AdvancedRenderWorkerMessage, RenderProgressUpdate } from './render-protocol.js';
import { AdvancedSourceValidationError, validateAdvancedProjectSource } from './source-validation.js';
import {AdvancedDiagnosticError, rendererFailureReport} from './diagnostics.js';
import {AdvancedTypecheckError, validateAdvancedProjectTypes} from './typecheck.js';

export type { RenderPhase, RenderProgressUpdate } from './render-protocol.js';

export interface AdvancedProjectResult {
  projectDir: string;
  projectFile: string;
  sceneFile: string;
  formatProfile: VideoFormatProfile;
}

export const motionCapabilities = {
  engine: 'Revideo 0.11 (MIT)',
  selectionRule: 'Capabilities and rigs are optional starting points. Start with the current story and art direction; freely customize, combine, replace, or ignore every library helper and author any compatible TypeScript, shader, SVG, or Three.js behavior the shot needs.',
  primitives: ['Rect', 'Circle', 'Polygon', 'Line', 'Spline', 'Path', 'SVG', 'Img', 'Video', 'Audio', 'Txt', 'Layout', 'Grid', 'Rive'],
  formats: ['landscape 16:9', 'portrait 9:16', 'square 1:1', 'platform-aware safe areas', 'adaptive layout helpers', 'focal cover crops'],
  captions: ['SRT and WebVTT import', 'exact word timing JSON', 'deterministic cue interpolation', 'word-follow captions', 'karaoke captions', 'semantic punch captions', 'speaker labels', 'caption timing QA'],
  animation: ['signals', 'tweens', 'springs', 'staggered sequences', 'custom easing', 'ten executable transition rigs', 'seven executable camera rigs', 'open custom camera paths', 'path drawing', 'continuous ambient timelines', 'ambient camera drift', 'ambient parallax', 'ambient orbit and light pulse', 'text interpolation', 'word cascades', 'letter tracking reveals', 'impact text', 'per-letter rise', 'animated text gradients', 'specular text sweeps', 'liquid-glass glyph refraction', 'typewriter with caret', 'erase and rewrite', 'blur-to-focus text', 'directional phrase swaps', 'text pushing text', 'camera-linked typography', 'vector glyph outlines', 'SVG shape morphing', 'text on paths', 'particle attraction and dissolution'],
  effects: ['blur', 'brightness', 'contrast', 'hue', 'saturation', 'shadows', 'blend modes', 'masks', 'optical liquid-glass refraction', 'GLSL destination-texture shaders', 'simplex-noise flow fields', 'selective bloom', 'depth of field', 'chromatic aberration', 'grain', 'vignette'],
  threeD: ['Three.js scenes', 'perspective cameras', 'textured product screens', 'lights', 'particles', 'depth and parallax'],
  exampleRecipes: ['footage-led emotional edit', 'continuous ambient shot', 'continuous visual transformation', 'kinetic manifesto', 'perspective product reveal', 'focused cursor interaction', 'interface assembly', 'editorial split proof', 'data visualization', 'typography-driven transition', 'abstract procedural environment', 'true 3D product stage', 'mandatory visual review pack'],
  componentLibrary: motionLibrarySummary,
  extensibility: 'Every new production is one unrestricted Revideo composition. Library rigs are never mandatory: the AI can customize or ignore them and write any compatible TypeScript, shaders, geometry, Three.js scenes, and timing inside the same production.',
};

const advancedSourceExtensions = new Set(['.ts', '.tsx', '.css', '.json', '.svg', '.glsl']);

function advancedProjectPath(projectDir: string, relativePath: string): string {
  const root = resolve(projectDir);
  const target = resolve(root, relativePath);
  if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error('File path must stay inside the advanced project directory');
  if (!advancedSourceExtensions.has(extname(target).toLowerCase())) throw new Error('Unsupported advanced project file type');
  return target;
}

export async function scaffoldAdvancedProject(options: {
  outputDir: string;
  name: string;
  format?: VideoFormatId;
  platform?: PlatformTarget;
  width?: number;
  height?: number;
  fps?: number;
}): Promise<AdvancedProjectResult> {
  const projectDir = resolve(options.outputDir);
  const formatProfile = resolveVideoFormat({ format: options.format, platform: options.platform, width: options.width, height: options.height });
  const source = fileURLToPath(new URL('../../assets/revideo-template/', import.meta.url));
  await mkdir(projectDir, { recursive: true });
  await cp(source, projectDir, { recursive: true });
  await mkdir(join(projectDir, 'public'), { recursive: true });
  const projectFile = join(projectDir, 'project.tsx');
  const content = (await readFile(projectFile, 'utf8'))
    .replaceAll('__PROJECT_NAME__', options.name.replaceAll('"', ''))
    .replaceAll('__WIDTH__', String(formatProfile.width))
    .replaceAll('__HEIGHT__', String(formatProfile.height))
    .replaceAll('__FPS__', String(options.fps ?? 30));
  await writeFile(projectFile, content, 'utf8');
  await writeFile(join(projectDir, 'motion-library.json'), JSON.stringify({
    ...motionLibrarySummary,
    components: motionComponentLibrary,
  }, null, 2), 'utf8');
  await writeFile(join(projectDir, 'format-profile.json'), `${JSON.stringify(formatProfile, null, 2)}\n`, 'utf8');
  return { projectDir, projectFile, sceneFile: join(projectDir, 'scene.tsx'), formatProfile };
}

export async function saveAdvancedProjectFile(projectDir: string, relativePath: string, source: string): Promise<string> {
  const target = advancedProjectPath(projectDir, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, source, 'utf8');
  return target;
}

export async function readAdvancedProjectFile(projectDir: string, relativePath: string): Promise<{ path: string; source: string }> {
  const target = advancedProjectPath(projectDir, relativePath);
  return { path: target, source: await readFile(target, 'utf8') };
}

export async function listAdvancedProjectFiles(projectDir: string): Promise<{ projectDir: string; files: string[] }> {
  const root = resolve(projectDir);
  const files: string[] = [];
  async function visit(directory: string, prefix = ''): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const relative = join(prefix, entry.name);
      if (entry.isDirectory()) await visit(join(directory, entry.name), relative);
      else if (entry.isFile() && advancedSourceExtensions.has(extname(entry.name).toLowerCase())) files.push(relative);
    }
  }
  await visit(root);
  return { projectDir: root, files: files.sort() };
}

export async function patchAdvancedProjectFile(
  projectDir: string,
  relativePath: string,
  patches: Array<{ find: string; replace: string }>,
): Promise<{ path: string; patchesApplied: number }> {
  const target = advancedProjectPath(projectDir, relativePath);
  if (patches.length === 0) throw new Error('At least one patch is required');
  let source = await readFile(target, 'utf8');
  for (const patch of patches) {
    if (!patch.find) throw new Error('Patch find text cannot be empty');
    const occurrences = source.split(patch.find).length - 1;
    if (occurrences !== 1) throw new Error(`Patch text must occur exactly once in ${relativePath}; found ${occurrences}`);
    source = source.replace(patch.find, patch.replace);
  }
  await writeFile(target, source, 'utf8');
  return { path: target, patchesApplied: patches.length };
}

export async function renderAdvancedProject(options: {
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
}): Promise<{ outputPath: string; engine: string }> {
  const projectFile = resolve(options.projectFile);
  const output = resolve(options.output);
  const workers = options.workers ?? 1;
  const startupTimeoutMs = options.startupTimeoutMs ?? 120_000;
  const stallTimeoutMs = options.stallTimeoutMs ?? 300_000;
  const maxRenderTimeMs = options.maxRenderTimeMs ?? 7_200_000;
  if ((options.rangeStart === undefined) !== (options.rangeEnd === undefined)) throw new Error('rangeStart and rangeEnd must be provided together');
  if (options.rangeStart !== undefined && options.rangeEnd !== undefined && options.rangeEnd <= options.rangeStart) throw new Error('rangeEnd must be greater than rangeStart');
  if (!existsSync(projectFile)) throw new Error(`Advanced project does not exist: ${projectFile}`);
  if (!Number.isInteger(workers) || workers < 1 || workers > 8) throw new Error('workers must be an integer between 1 and 8');
  for (const [name, value] of Object.entries({ startupTimeoutMs, stallTimeoutMs, maxRenderTimeMs })) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be greater than zero`);
  }
  const sourceValidation = await validateAdvancedProjectSource(projectFile);
  if (!sourceValidation.valid) throw new AdvancedSourceValidationError(sourceValidation);
  const typecheck = validateAdvancedProjectTypes(projectFile);
  if (!typecheck.valid) throw new AdvancedTypecheckError(typecheck);
  await mkdir(dirname(output), { recursive: true });

  return new Promise((resolvePromise, rejectPromise) => {
    const workerFile = fileURLToPath(new URL('./render-worker.js', import.meta.url));
    const child = fork(workerFile, [], {
      cwd: dirname(projectFile),
      detached: process.platform !== 'win32',
      env: { ...process.env, DISABLE_TELEMETRY: 'true' },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    const childPid = child.pid;
    let settled = false;
    let startedRendering = false;
    let diagnostics = '';
    let currentUpdate: RenderProgressUpdate = { phase: 'starting', progress: 0, message: 'Starting isolated Revideo renderer', workers };
    let stallTimer: NodeJS.Timeout | undefined;

    const report = (update: RenderProgressUpdate): void => {
      currentUpdate = update;
      Promise.resolve(options.onProgress?.(update)).catch(() => undefined);
    };

    const emitHeartbeat = (update: RenderProgressUpdate): void => {
      Promise.resolve(options.onProgress?.(update)).catch(() => undefined);
    };

    const terminateTree = (): void => {
      if (!childPid) return;
      if (process.platform === 'win32') {
        const killer = spawn('taskkill', ['/pid', String(childPid), '/T', '/F'], { stdio: 'ignore' });
        killer.unref();
        return;
      }
      try {
        process.kill(-childPid, 'SIGTERM');
      } catch {
        try { child.kill('SIGTERM'); } catch { /* already gone */ }
      }
      const forceTimer = setTimeout(() => {
        try { process.kill(-childPid, 'SIGKILL'); } catch { /* process group is gone */ }
      }, 1_500);
      forceTimer.unref();
    };

    const clearTimers = (): void => {
      clearTimeout(startupTimer);
      clearTimeout(maxTimer);
      clearInterval(heartbeatTimer);
      if (stallTimer) clearTimeout(stallTimer);
    };

    const finishWithError = (error: Error): void => {
      if (settled) return;
      settled = true;
      clearTimers();
      options.signal?.removeEventListener('abort', onAbort);
      terminateTree();
      const detail = diagnostics.trim();
      const raw = [error.stack, detail].filter(Boolean).join('\n');
      rejectPromise(error instanceof AdvancedDiagnosticError
        ? error
        : new AdvancedDiagnosticError(rendererFailureReport(error.message, raw, projectFile)));
    };

    const resetStallTimer = (): void => {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        finishWithError(new Error(`Advanced renderer made no measurable progress for ${Math.round(stallTimeoutMs / 1000)} seconds`));
      }, stallTimeoutMs);
      stallTimer.unref();
    };

    const onAbort = (): void => {
      const error = new Error('Advanced render was cancelled');
      error.name = 'AbortError';
      finishWithError(error);
    };

    const startupTimer = setTimeout(() => {
      finishWithError(new Error(`Advanced renderer did not produce its first frame within ${Math.round(startupTimeoutMs / 1000)} seconds`));
    }, startupTimeoutMs);
    startupTimer.unref();
    const maxTimer = setTimeout(() => {
      finishWithError(new Error(`Advanced render exceeded its ${Math.round(maxRenderTimeMs / 1000)} second maximum runtime`));
    }, maxRenderTimeMs);
    maxTimer.unref();
    const heartbeatStartedAt = Date.now();
    const heartbeatTimer = setInterval(() => {
      if (settled) return;
      const elapsed = Math.round((Date.now() - heartbeatStartedAt) / 1000);
      emitHeartbeat({ ...currentUpdate, message: `${currentUpdate.message} · ${elapsed}s elapsed` });
    }, 5_000);
    heartbeatTimer.unref();

    report(currentUpdate);
    child.stdout?.on('data', (chunk: Buffer) => { diagnostics = `${diagnostics}${chunk.toString()}`.slice(-8_000); });
    child.stderr?.on('data', (chunk: Buffer) => { diagnostics = `${diagnostics}${chunk.toString()}`.slice(-8_000); });
    child.on('error', (error) => finishWithError(new Error(`Could not start advanced renderer: ${error.message}`)));
    child.on('message', (rawMessage: AdvancedRenderWorkerMessage) => {
      if (settled) return;
      const message = rawMessage;
      if (message.type === 'ready') {
        const request: AdvancedRenderParentMessage = {
          type: 'render',
          options: {
            projectFile,
            output,
            variables: options.variables,
            workers,
            width: options.width,
            height: options.height,
            rangeStart: options.rangeStart,
            rangeEnd: options.rangeEnd,
          },
        };
        child.send(request);
        return;
      }
      if (message.type === 'progress') {
        if (message.update.phase === 'rendering') {
          if (!startedRendering) {
            startedRendering = true;
            clearTimeout(startupTimer);
          }
          resetStallTimer();
        } else if (message.update.phase === 'encoding') {
          resetStallTimer();
        } else if (message.update.phase === 'complete') {
          if (stallTimer) clearTimeout(stallTimer);
        }
        report(message.update);
        return;
      }
      if (message.type === 'error') {
        diagnostics = `${diagnostics}\n${message.stack ?? message.message}`.slice(-8_000);
        finishWithError(new Error(`Advanced renderer failed: ${message.message}`));
        return;
      }
      if (message.type === 'complete') {
        settled = true;
        clearTimers();
        options.signal?.removeEventListener('abort', onAbort);
        resolvePromise({ outputPath: resolve(message.outputPath), engine: 'revideo' });
      }
    });
    child.on('exit', (code, signal) => {
      if (!settled) finishWithError(new Error(`Advanced renderer exited before completion (code ${code ?? 'none'}, signal ${signal ?? 'none'})`));
    });
    if (options.signal?.aborted) {
      onAbort();
      return;
    }
    options.signal?.addEventListener('abort', onAbort, { once: true });
  });
}
