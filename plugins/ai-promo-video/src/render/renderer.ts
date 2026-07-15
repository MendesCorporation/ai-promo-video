import { cpus } from 'node:os';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPathValue from 'ffmpeg-static';
import { chromium, type Page } from 'playwright';
import { VideoSpecSchema, type RenderResult, type VideoSpec } from '../types.js';
import { resolveAudioTrack } from '../audio/catalog.js';
import { fileToDataUri, readJson, resolveFrom, writeJson } from '../utils/files.js';
import { runCommand } from '../utils/process.js';

interface RenderOptions {
  keepFrames?: boolean;
  workers?: number;
}

async function preparedSpec(spec: VideoSpec, specPath: string): Promise<VideoSpec> {
  const brand = { ...spec.brand };
  if (brand.logo && !brand.logo.startsWith('data:')) brand.logo = await fileToDataUri(resolveFrom(specPath, brand.logo));
  const scenes = await Promise.all(spec.scenes.map(async (scene) => ({
    ...scene,
    media: scene.media && !scene.media.startsWith('data:')
      ? await fileToDataUri(resolveFrom(specPath, scene.media))
      : scene.media,
  })));
  return { ...spec, brand, scenes };
}

async function loadPlayerDocument(spec: VideoSpec): Promise<string> {
  const templatePath = fileURLToPath(new URL('../../assets/player.html', import.meta.url));
  const template = await readFile(templatePath, 'utf8');
  const serialized = JSON.stringify(spec).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
  return template.replace('__VIDEO_SPEC__', serialized);
}

async function renderWorker(page: Page, html: string, frames: number[], framesDir: string, onFrame: () => void): Promise<void> {
  await page.setContent(html, { waitUntil: 'load' });
  for (const frame of frames) {
    await page.evaluate(async (value) => {
      await (window as unknown as { renderFrame: (frame: number) => Promise<void> }).renderFrame(value);
    }, frame);
    await page.screenshot({
      path: join(framesDir, `frame-${String(frame).padStart(6, '0')}.jpg`),
      type: 'jpeg',
      quality: 94,
    });
    onFrame();
  }
}

export async function renderVideo(spec: VideoSpec, specPath: string, options: RenderOptions = {}): Promise<RenderResult> {
  const parsed = VideoSpecSchema.parse(spec);
  const hydrated = await preparedSpec(parsed, specPath);
  const outputPath = resolveFrom(specPath, parsed.output);
  const framesDir = join(dirname(outputPath), 'render-frames', parsed.id);
  await rm(framesDir, { recursive: true, force: true });
  await mkdir(framesDir, { recursive: true });
  await mkdir(dirname(outputPath), { recursive: true });

  const totalFrames = Math.round(parsed.duration * parsed.fps);
  const requestedWorkers = options.workers ?? Math.min(4, Math.max(1, Math.floor(cpus().length / 2)));
  const workerCount = Math.min(requestedWorkers, totalFrames);
  const assignments = Array.from({ length: workerCount }, () => [] as number[]);
  for (let frame = 0; frame < totalFrames; frame += 1) assignments[frame % workerCount].push(frame);

  const html = await loadPlayerDocument(hydrated);
  const browser = await chromium.launch({ headless: true });
  let completed = 0;
  let lastReported = -1;
  const onFrame = () => {
    completed += 1;
    const percent = Math.floor((completed / totalFrames) * 10) * 10;
    if (percent !== lastReported) {
      lastReported = percent;
      console.log(`Rendering frames: ${Math.min(percent, 100)}% (${completed}/${totalFrames})`);
    }
  };

  try {
    const pages = await Promise.all(assignments.map(() => browser.newPage({
      viewport: { width: parsed.width, height: parsed.height },
      deviceScaleFactor: 1,
    })));
    await Promise.all(pages.map((page, index) => renderWorker(page, html, assignments[index], framesDir, onFrame)));
  } finally {
    await browser.close();
  }

  const ffmpegPath = ffmpegPathValue as unknown as string | null;
  if (!ffmpegPath) throw new Error('ffmpeg-static did not provide a binary for this platform');
  const args = [
    '-y',
    '-framerate', String(parsed.fps),
    '-start_number', '0',
    '-i', join(framesDir, 'frame-%06d.jpg'),
  ];
  let audioTrack: string | undefined;
  if (parsed.music) {
    audioTrack = await resolveAudioTrack(parsed.music.track, specPath);
    args.push('-stream_loop', '-1', '-i', audioTrack);
  }
  args.push(
    '-map', '0:v:0',
    ...(audioTrack ? ['-map', '1:a:0'] : ['-an']),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-r', String(parsed.fps),
  );
  if (audioTrack && parsed.music) {
    const fadeStart = Math.max(0, parsed.duration - 0.8);
    args.push(
      '-filter:a', `volume=${parsed.music.volume},afade=t=in:st=0:d=0.45,afade=t=out:st=${fadeStart}:d=0.8`,
      '-c:a', 'aac',
      '-b:a', '192k',
    );
  }
  args.push('-t', String(parsed.duration), '-movflags', '+faststart', outputPath);
  console.log(`Encoding video: ${outputPath}`);
  await runCommand(ffmpegPath, args, { quiet: true });

  const result: RenderResult = {
    outputPath,
    duration: parsed.duration,
    frames: totalFrames,
    width: parsed.width,
    height: parsed.height,
    fps: parsed.fps,
    audioTrack,
  };
  await writeJson(`${outputPath}.render.json`, result);
  if (!options.keepFrames) await rm(framesDir, { recursive: true, force: true });
  return result;
}

export async function renderFromSpecFile(path: string, options: RenderOptions = {}): Promise<RenderResult> {
  const absolutePath = resolve(path);
  const spec = VideoSpecSchema.parse(await readJson<unknown>(absolutePath));
  return renderVideo(spec, absolutePath, options);
}
