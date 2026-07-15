import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPathValue from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

const require = createRequire(import.meta.url);

export interface AdvancedProjectResult {
  projectDir: string;
  projectFile: string;
  sceneFile: string;
}

export const motionCapabilities = {
  engine: 'Revideo 0.11 (MIT)',
  primitives: ['Rect', 'Circle', 'Polygon', 'Line', 'Spline', 'Path', 'SVG', 'Img', 'Video', 'Audio', 'Txt', 'Layout', 'Grid', 'Rive'],
  animation: ['signals', 'tweens', 'springs', 'staggered sequences', 'custom easing', 'scene transitions', 'path drawing', 'text interpolation', 'word cascades', 'letter tracking reveals', 'impact text', 'per-letter rise', 'animated text gradients', 'typewriter with caret', 'erase and rewrite', 'blur-to-focus text', 'directional phrase swaps', 'text pushing text', 'camera-linked typography'],
  effects: ['blur', 'brightness', 'contrast', 'hue', 'saturation', 'shadows', 'blend modes', 'masks', 'shaders'],
  threeD: ['Three.js scenes', 'perspective cameras', 'textured product screens', 'lights', 'particles', 'depth and parallax'],
  productPatterns: ['perspective screen reveal', 'cursor tour with click pulse', 'UI assembly', 'card stack', 'split screen', 'focus zoom', 'data visualization', 'measured text rows', 'text-driven transitions', 'kinetic manifesto', 'mandatory visual review pack'],
  extensibility: 'The AI writes TypeScript scenes and may define new components, shaders, geometry, and timing for every video.',
};

function packageDirectory(name: string): string {
  let current = dirname(require.resolve(name));
  while (!existsSync(join(current, 'package.json'))) {
    const parent = dirname(current);
    if (parent === current) throw new Error(`Could not locate package directory for ${name}`);
    current = parent;
  }
  return current;
}

const advancedSourceExtensions = new Set(['.ts', '.tsx', '.css', '.json', '.svg']);

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
  width?: number;
  height?: number;
  fps?: number;
}): Promise<AdvancedProjectResult> {
  const projectDir = resolve(options.outputDir);
  const source = fileURLToPath(new URL('../../assets/revideo-template/', import.meta.url));
  await mkdir(projectDir, { recursive: true });
  await cp(source, projectDir, { recursive: true });
  await mkdir(join(projectDir, 'public'), { recursive: true });
  const projectFile = join(projectDir, 'project.tsx');
  const content = (await readFile(projectFile, 'utf8'))
    .replaceAll('__PROJECT_NAME__', options.name.replaceAll('"', ''))
    .replaceAll('__WIDTH__', String(options.width ?? 1920))
    .replaceAll('__HEIGHT__', String(options.height ?? 1080))
    .replaceAll('__FPS__', String(options.fps ?? 30));
  await writeFile(projectFile, content, 'utf8');
  return { projectDir, projectFile, sceneFile: join(projectDir, 'scene.tsx') };
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
}): Promise<{ outputPath: string; engine: string }> {
  process.env.DISABLE_TELEMETRY = 'true';
  const ffmpegPath = ffmpegPathValue as unknown as string | null;
  if (ffmpegPath) process.env.FFMPEG_PATH = ffmpegPath;
  process.env.FFPROBE_PATH = ffprobeStatic.path;
  const { renderVideo } = await import('@revideo/renderer');
  const projectFile = resolve(options.projectFile);
  const output = resolve(options.output);
  if ((options.rangeStart === undefined) !== (options.rangeEnd === undefined)) throw new Error('rangeStart and rangeEnd must be provided together');
  if (options.rangeStart !== undefined && options.rangeEnd !== undefined && options.rangeEnd <= options.rangeStart) throw new Error('rangeEnd must be greater than rangeStart');
  const aliases = ['@revideo/core', '@revideo/2d', 'three'].map((name) => ({ find: name, replacement: packageDirectory(name) }));
  const localPublicDir = join(dirname(projectFile), 'public');
  const parentPublicDir = join(dirname(dirname(projectFile)), 'public');
  const publicDir = existsSync(localPublicDir) ? localPublicDir : existsSync(parentPublicDir) ? parentPublicDir : localPublicDir;
  const projectSettings = {
    ...(options.width && options.height ? { size: { x: options.width, y: options.height } } : {}),
    ...(options.rangeStart !== undefined && options.rangeEnd !== undefined ? { range: [options.rangeStart, options.rangeEnd] as [number, number] } : {}),
  };
  const outputPath = await renderVideo({
    projectFile,
    variables: options.variables,
    settings: {
      outFile: basename(output) as `${string}.mp4`,
      outDir: dirname(output),
      workers: options.workers ?? 1,
      logProgress: true,
      ...(Object.keys(projectSettings).length ? { projectSettings } : {}),
      ...(ffmpegPath ? { ffmpeg: { ffmpegPath, ffprobePath: ffprobeStatic.path, ffmpegLogLevel: 'error' as const } } : {}),
      viteConfig: { publicDir, resolve: { alias: aliases } },
    },
  });
  return { outputPath: resolve(outputPath), engine: 'revideo' };
}
