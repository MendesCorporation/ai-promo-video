import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import ffmpegPathValue from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { aggregateWorkerProgress, type AdvancedRenderParentMessage, type AdvancedRenderWorkerMessage, type RenderProgressUpdate } from './render-protocol.js';

const require = createRequire(import.meta.url);

function packageDirectory(name: string): string {
  let current = dirname(require.resolve(name));
  while (!existsSync(join(current, 'package.json'))) {
    const parent = dirname(current);
    if (parent === current) throw new Error(`Could not locate package directory for ${name}`);
    current = parent;
  }
  return current;
}

function send(message: AdvancedRenderWorkerMessage): void {
  if (process.connected) process.send?.(message);
}

function sendAndFlush(message: AdvancedRenderWorkerMessage): Promise<void> {
  if (!process.connected || !process.send) return Promise.resolve();
  return new Promise((resolvePromise) => {
    process.send?.(message, () => resolvePromise());
  });
}

async function render(options: AdvancedRenderParentMessage['options']): Promise<void> {
  process.env.DISABLE_TELEMETRY = 'true';
  const ffmpegPath = ffmpegPathValue as unknown as string | null;
  if (ffmpegPath) process.env.FFMPEG_PATH = ffmpegPath;
  process.env.FFPROBE_PATH = ffprobeStatic.path;

  const projectFile = resolve(options.projectFile);
  const output = resolve(options.output);
  const projectDirectory = dirname(projectFile);
  const localPublicDir = join(projectDirectory, 'public');
  const parentPublicDir = join(dirname(projectDirectory), 'public');
  const publicDir = existsSync(localPublicDir) ? localPublicDir : existsSync(parentPublicDir) ? parentPublicDir : localPublicDir;
  await mkdir(dirname(output), { recursive: true });

  // Revideo resolves the project relative to cwd even when given an absolute path.
  // Keeping cwd beside project.tsx also makes authored relative asset imports deterministic.
  process.chdir(projectDirectory);

  const aliases = [
    '@revideo/core',
    '@revideo/2d',
    '@revideo/renderer',
    '@revideo/ui',
    '@revideo/vite-plugin',
    'three',
    'flubber',
    'opentype.js',
    'postprocessing',
    'simplex-noise',
  ].map((name) => ({ find: name, replacement: packageDirectory(name) }));
  const projectSettings = {
    ...(options.width && options.height ? { size: { x: options.width, y: options.height } } : {}),
    ...(options.rangeStart !== undefined && options.rangeEnd !== undefined ? { range: [options.rangeStart, options.rangeEnd] as [number, number] } : {}),
  };
  const workerProgress = new Map<number, number>();
  let lastSentAt = 0;
  let lastSentPercent = -1;
  let encodingAnnounced = false;

  const report = (worker: number, progress: number): void => {
    workerProgress.set(worker, progress);
    const aggregate = aggregateWorkerProgress(workerProgress, options.workers);
    const percent = Math.floor(aggregate * 100);
    const now = Date.now();
    if (percent === lastSentPercent && now - lastSentAt < 750) return;
    lastSentAt = now;
    lastSentPercent = percent;
    const update: RenderProgressUpdate = {
      phase: 'rendering',
      progress: 0.02 + aggregate * 0.9,
      message: `Rendering frames: ${percent}% (${options.workers} worker${options.workers === 1 ? '' : 's'})`,
      worker,
      workers: options.workers,
    };
    send({ type: 'progress', update });
    if (aggregate >= 1 && !encodingAnnounced) {
      encodingAnnounced = true;
      send({
        type: 'progress',
        update: { phase: 'encoding', progress: 0.94, message: 'Frames complete; encoding and assembling the final MP4', workers: options.workers },
      });
    }
  };

  send({ type: 'progress', update: { phase: 'starting', progress: 0.01, message: 'Starting isolated Revideo renderer', workers: options.workers } });
  const { renderVideo } = await import('@revideo/renderer');
  const outputPath = await renderVideo({
    projectFile: `./${basename(projectFile)}`,
    variables: options.variables,
    settings: {
      outFile: basename(output) as `${string}.mp4`,
      outDir: dirname(output),
      workers: options.workers,
      logProgress: false,
      progressCallback: report,
      puppeteer: { headless: true },
      ...(Object.keys(projectSettings).length ? { projectSettings } : {}),
      ...(ffmpegPath ? { ffmpeg: { ffmpegPath, ffprobePath: ffprobeStatic.path, ffmpegLogLevel: 'error' as const } } : {}),
      viteConfig: { publicDir, resolve: { alias: aliases } },
    },
  });

  const absoluteOutput = resolve(outputPath);
  if (!existsSync(absoluteOutput)) throw new Error(`Renderer completed without creating the expected output: ${absoluteOutput}`);
  send({ type: 'progress', update: { phase: 'complete', progress: 1, message: 'Render complete', workers: options.workers } });
  await sendAndFlush({ type: 'complete', outputPath: absoluteOutput });
}

let started = false;
process.on('message', (message: AdvancedRenderParentMessage) => {
  if (started || message?.type !== 'render') return;
  started = true;
  void render(message.options)
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      const normalized = error instanceof Error ? error : new Error(String(error));
      // The parent owns process-tree cleanup because Revideo can leave Chromium
      // running after failures that happen before its completion callback exists.
      void sendAndFlush({ type: 'error', message: normalized.message, stack: normalized.stack })
        .finally(() => setTimeout(() => process.exit(1), 25));
    });
});

send({ type: 'ready' });
