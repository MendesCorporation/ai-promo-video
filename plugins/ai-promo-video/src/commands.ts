import { resolve } from 'node:path';
import { generateAudioLibrary } from './audio/generate-library.js';
import { listAudioTracks } from './audio/catalog.js';
import { downloadOpenverseMusic, searchOpenverseMusic } from './audio/openverse.js';
import { searchLocalMusic } from './audio/search.js';
import { captureFromSpecFile, inspectSite, recordFromSpecFile } from './capture/capture.js';
import { createVisualReviewPack, extractReviewFrames, probeVideo } from './render/probe.js';
import { renderFromSpecFile } from './render/renderer.js';
import { motionCapabilities, patchAdvancedProjectFile, renderAdvancedProject, scaffoldAdvancedProject } from './advanced/engine.js';
import { editImage, editVideo, mixMusic, replaceVideoRange } from './media/edit.js';
import { downloadFreeAsset, downloadFreeVideo, searchFreeAssets, searchFreeVideos, type AssetSearchProvider, type VideoSearchProvider } from './library/search.js';
import type { MediaOrientation } from './types.js';
import { CaptureSpecSchema, VideoSpecSchema } from './types.js';
import { readJson } from './utils/files.js';

function enumFlag<T extends string>(value: string | boolean | undefined, allowed: readonly T[], fallback: T, name: string): T {
  const candidate = typeof value === 'string' ? value : fallback;
  if (!allowed.includes(candidate as T)) throw new Error(`${name} must be one of: ${allowed.join(', ')}`);
  return candidate as T;
}

function numberFlag(value: string | boolean | undefined): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Expected a number, received: ${value}`);
  return parsed;
}

export async function validateSpec(path: string, kind: 'video' | 'capture' = 'video'): Promise<Record<string, unknown>> {
  const absolutePath = resolve(path);
  const value = await readJson<unknown>(absolutePath);
  if (kind === 'capture') {
    const spec = CaptureSpecSchema.parse(value);
    return { valid: true, kind, path: absolutePath, targets: spec.targets.length, recordings: spec.recordings.length };
  }
  const spec = VideoSpecSchema.parse(value);
  return { valid: true, kind, path: absolutePath, scenes: spec.scenes.length, duration: spec.duration, frames: spec.duration * spec.fps };
}

export async function runCommandByName(name: string, args: string[], flags: Record<string, string | boolean>): Promise<unknown> {
  switch (name) {
    case 'inspect': {
      const [url] = args;
      if (!url) throw new Error('Usage: ai-promo inspect <url> [--screenshot path]');
      return inspectSite(url, typeof flags.screenshot === 'string' ? flags.screenshot : undefined);
    }
    case 'capture': {
      if (!args[0]) throw new Error('Usage: ai-promo capture <capture.json>');
      return captureFromSpecFile(args[0]);
    }
    case 'record': {
      if (!args[0]) throw new Error('Usage: ai-promo record <capture.json>');
      return recordFromSpecFile(args[0]);
    }
    case 'music':
      return listAudioTracks({
        mood: typeof flags.mood === 'string' ? flags.mood : undefined,
        maxIntensity: typeof flags['max-intensity'] === 'string' ? Number(flags['max-intensity']) : undefined,
      });
    case 'music:search': {
      const query = typeof flags.query === 'string' ? flags.query : args.join(' ');
      const provider = typeof flags.provider === 'string' ? flags.provider : 'all';
      const minDuration = typeof flags['min-duration'] === 'string' ? Number(flags['min-duration']) : undefined;
      const maxDuration = typeof flags['max-duration'] === 'string' ? Number(flags['max-duration']) : undefined;
      const directories = typeof flags.dirs === 'string' ? flags.dirs.split(',').filter(Boolean) : [];
      const results = [];
      if (provider === 'all' || provider === 'local') results.push(...await searchLocalMusic({ query, directories, minDuration, maxDuration, allowUnknownLicense: flags['allow-unknown-license'] === true }));
      if (provider === 'all' || provider === 'openverse') {
        if (!query) throw new Error('Online music search requires --query');
        results.push(...await searchOpenverseMusic({ query, minDuration, maxDuration, source: typeof flags.source === 'string' ? flags.source : undefined }));
      }
      return results;
    }
    case 'music:download': {
      const id = args[0];
      if (!id) throw new Error('Usage: ai-promo music:download <openverse-id> --output-dir <dir>');
      const outputDir = typeof flags['output-dir'] === 'string' ? flags['output-dir'] : './music';
      return downloadOpenverseMusic(id, outputDir);
    }
    case 'video:search': {
      const query = typeof flags.query === 'string' ? flags.query : args.join(' ');
      return searchFreeVideos({
        query: query || undefined,
        provider: enumFlag<VideoSearchProvider>(flags.provider, ['all', 'local', 'wikimedia', 'pexels'], 'all', 'provider'),
        localDirectories: typeof flags.dirs === 'string' ? flags.dirs.split(',').filter(Boolean) : [],
        orientation: typeof flags.orientation === 'string' ? enumFlag<MediaOrientation>(flags.orientation, ['landscape', 'portrait', 'square'], 'landscape', 'orientation') : undefined,
        minDuration: numberFlag(flags['min-duration']),
        maxDuration: numberFlag(flags['max-duration']),
        minWidth: numberFlag(flags['min-width']),
        minHeight: numberFlag(flags['min-height']),
        pageSize: numberFlag(flags['page-size']),
        pexelsLocale: typeof flags.locale === 'string' ? flags.locale : undefined,
        includeShareAlike: flags['include-share-alike'] === true,
        allowUnknownLocalLicense: flags['allow-unknown-license'] === true,
      });
    }
    case 'video:download': {
      const id = args[0];
      if (!id) throw new Error('Usage: ai-promo video:download <id> --provider wikimedia|pexels --output-dir <dir>');
      const provider = enumFlag(flags.provider, ['wikimedia', 'pexels'] as const, 'wikimedia', 'provider');
      return downloadFreeVideo(provider, id, typeof flags['output-dir'] === 'string' ? flags['output-dir'] : './videos', { includeShareAlike: flags['include-share-alike'] === true });
    }
    case 'asset:search': {
      const query = typeof flags.query === 'string' ? flags.query : args.join(' ');
      return searchFreeAssets({
        query: query || undefined,
        provider: enumFlag<AssetSearchProvider>(flags.provider, ['all', 'local', 'openverse', 'wikimedia', 'pexels'], 'all', 'provider'),
        localDirectories: typeof flags.dirs === 'string' ? flags.dirs.split(',').filter(Boolean) : [],
        kind: enumFlag(flags.kind, ['all', 'image', 'svg', 'animation'] as const, 'all', 'kind'),
        orientation: typeof flags.orientation === 'string' ? enumFlag<MediaOrientation>(flags.orientation, ['landscape', 'portrait', 'square'], 'landscape', 'orientation') : undefined,
        minWidth: numberFlag(flags['min-width']),
        minHeight: numberFlag(flags['min-height']),
        pageSize: numberFlag(flags['page-size']),
        openverseSource: typeof flags.source === 'string' ? flags.source : undefined,
        pexelsLocale: typeof flags.locale === 'string' ? flags.locale : undefined,
        includeShareAlike: flags['include-share-alike'] === true,
        allowUnknownLocalLicense: flags['allow-unknown-license'] === true,
      });
    }
    case 'asset:download': {
      const id = args[0];
      if (!id) throw new Error('Usage: ai-promo asset:download <id> --provider openverse|wikimedia|pexels --output-dir <dir>');
      const provider = enumFlag(flags.provider, ['openverse', 'wikimedia', 'pexels'] as const, 'openverse', 'provider');
      return downloadFreeAsset(provider, id, typeof flags['output-dir'] === 'string' ? flags['output-dir'] : './assets', { includeShareAlike: flags['include-share-alike'] === true });
    }
    case 'audio:generate':
      return { generated: await generateAudioLibrary() };
    case 'validate': {
      if (!args[0]) throw new Error('Usage: ai-promo validate <spec.json> [--kind video|capture]');
      const kind = flags.kind === 'capture' ? 'capture' : 'video';
      return validateSpec(args[0], kind);
    }
    case 'render': {
      if (!args[0]) throw new Error('Usage: ai-promo render <video.json> [--workers 4] [--keep-frames]');
      return renderFromSpecFile(args[0], {
        workers: typeof flags.workers === 'string' ? Number(flags.workers) : undefined,
        keepFrames: flags['keep-frames'] === true,
      });
    }
    case 'motion:capabilities':
      return motionCapabilities;
    case 'advanced:init': {
      const outputDir = args[0];
      if (!outputDir) throw new Error('Usage: ai-promo advanced:init <directory> --name <name>');
      return scaffoldAdvancedProject({
        outputDir,
        name: typeof flags.name === 'string' ? flags.name : 'Advanced AI Promo',
        width: typeof flags.width === 'string' ? Number(flags.width) : undefined,
        height: typeof flags.height === 'string' ? Number(flags.height) : undefined,
        fps: typeof flags.fps === 'string' ? Number(flags.fps) : undefined,
      });
    }
    case 'advanced:render': {
      const projectFile = args[0];
      if (!projectFile) throw new Error('Usage: ai-promo advanced:render <project.tsx> --output <video.mp4>');
      if (typeof flags.output !== 'string') throw new Error('advanced:render requires --output');
      return renderAdvancedProject({
        projectFile,
        output: flags.output,
        workers: typeof flags.workers === 'string' ? Number(flags.workers) : undefined,
        rangeStart: typeof flags.start === 'string' ? Number(flags.start) : undefined,
        rangeEnd: typeof flags.end === 'string' ? Number(flags.end) : undefined,
      });
    }
    case 'advanced:patch': {
      const projectDir = args[0];
      const relativePath = args[1];
      const patchesFile = args[2];
      if (!projectDir || !relativePath || !patchesFile) throw new Error('Usage: ai-promo advanced:patch <project-dir> <relative-file> <patches.json>');
      return patchAdvancedProjectFile(projectDir, relativePath, await readJson<Array<{ find: string; replace: string }>>(resolve(patchesFile)));
    }
    case 'image:edit': {
      if (!args[0]) throw new Error('Usage: ai-promo image:edit <edit.json>');
      return editImage(await readJson(resolve(args[0])));
    }
    case 'video:edit': {
      if (!args[0]) throw new Error('Usage: ai-promo video:edit <edit.json>');
      return editVideo(await readJson(resolve(args[0])));
    }
    case 'video:replace-range': {
      if (!args[0]) throw new Error('Usage: ai-promo video:replace-range <replace.json>');
      return replaceVideoRange(await readJson(resolve(args[0])));
    }
    case 'music:mix': {
      if (!args[0]) throw new Error('Usage: ai-promo music:mix <mix.json>');
      return mixMusic(await readJson(resolve(args[0])));
    }
    case 'probe': {
      if (!args[0]) throw new Error('Usage: ai-promo probe <video.mp4>');
      return probeVideo(args[0]);
    }
    case 'review': {
      if (!args[0]) throw new Error('Usage: ai-promo review <video.mp4> --output-dir <dir> --times 2,8,15');
      const outputDir = typeof flags['output-dir'] === 'string' ? flags['output-dir'] : './review-frames';
      const times = String(flags.times ?? '1,5,10').split(',').map(Number).filter(Number.isFinite);
      return { frames: await extractReviewFrames(args[0], outputDir, times) };
    }
    case 'review:auto': {
      if (!args[0]) throw new Error('Usage: ai-promo review:auto <video.mp4> --output-dir <dir> [--interval 2 --transitions 4.5,8,13]');
      const outputDir = typeof flags['output-dir'] === 'string' ? flags['output-dir'] : './visual-review';
      const transitionTimes = String(flags.transitions ?? '').split(',').filter(Boolean).map(Number).filter(Number.isFinite);
      return createVisualReviewPack(args[0], outputDir, {
        overviewInterval: typeof flags.interval === 'string' ? Number(flags.interval) : undefined,
        transitionTimes,
        transitionWindow: typeof flags.window === 'string' ? Number(flags.window) : undefined,
        transitionFps: typeof flags.fps === 'string' ? Number(flags.fps) : undefined,
      });
    }
    default:
      throw new Error(`Unknown command: ${name}`);
  }
}
