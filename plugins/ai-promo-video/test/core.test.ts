import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listAdvancedProjectFiles, motionCapabilities, patchAdvancedProjectFile, readAdvancedProjectFile, scaffoldAdvancedProject } from '../src/advanced/engine.js';
import { listAudioTracks } from '../src/audio/catalog.js';
import { analyzeMusic } from '../src/audio/analyze.js';
import { searchLocalMusic } from '../src/audio/search.js';
import { motionComponentLibrary, searchMotionComponents } from '../src/advanced/library.js';
import { editImage, musicEnvelopeExpression } from '../src/media/edit.js';
import { assessFreeLicense } from '../src/library/license.js';
import { searchLocalAssets, searchLocalVideos } from '../src/library/local.js';
import { normalizePexelsPhoto, normalizePexelsVideo } from '../src/library/pexels.js';
import { CaptureSpecSchema, VideoSpecSchema } from '../src/types.js';
import { validateSpec } from '../src/commands.js';
import { cleanDeliveryOutput } from '../src/media/cleanup.js';
import {
  clientMcpConfigPath,
  clientSkillDestination,
  defaultClaudeDesktopConfigPath,
  defaultRuntimeDir,
  parseInstallArgs,
  parseWindowsWhereOutput,
  windowsClaudeDesktopStoreConfigPath,
  windowsCommandNeedsShell,
} from '../src/install.js';
import { aggregateWorkerProgress } from '../src/advanced/render-protocol.js';

function plan() {
  return {
    version: 1 as const,
    id: 'test-promo',
    title: 'Test',
    width: 640,
    height: 360,
    fps: 24,
    duration: 2,
    brand: { name: 'Test' },
    scenes: [
      { id: 'hero', type: 'hero' as const, duration: 1, title: 'A clear promise' },
      { id: 'cta', type: 'cta' as const, duration: 1, title: 'Try it now' },
    ],
    output: './test.mp4',
  };
}

describe('video plans', () => {
  it('accepts a frame-exact plan and applies defaults', () => {
    const parsed = VideoSpecSchema.parse(plan());
    expect(parsed.scenes).toHaveLength(2);
    expect(parsed.brand.accent).toBe('#7c5cff');
  });

  it('rejects scene durations that do not equal video duration', () => {
    const invalid = plan();
    invalid.scenes[1].duration = 0.5;
    expect(() => VideoSpecSchema.parse(invalid)).toThrow(/Scene durations total/);
  });

  it('validates a JSON spec from disk', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-'));
    const path = join(directory, 'video.json');
    await writeFile(path, JSON.stringify(plan()));
    await expect(validateSpec(path)).resolves.toMatchObject({ valid: true, scenes: 2, frames: 48 });
  });
});

describe('open music catalog', () => {
  it('filters tracks by mood and intensity', async () => {
    const tracks = await listAudioTracks({ mood: 'focused', maxIntensity: 0.7 });
    expect(tracks.length).toBeGreaterThan(0);
    expect(tracks.every((track) => track.license === 'CC0-1.0')).toBe(true);
  });

  it('builds a piecewise-linear gain envelope for frame-accurate music cues', () => {
    expect(musicEnvelopeExpression([
      { time: 0, volume: 0 },
      { time: 1, volume: 1 },
      { time: 2, volume: 0.5 },
    ])).toContain('if(lt(t,1)');
    expect(() => musicEnvelopeExpression([{ time: 1, volume: 1 }, { time: 1, volume: 0 }])).toThrow(/strictly increasing/);
  });

  it('does not inject bundled tracks into a general local search', async () => {
    expect(await searchLocalMusic()).toEqual([]);
    const bundled = await searchLocalMusic({ includeBundled: true });
    expect(bundled.length).toBeGreaterThanOrEqual(3);
    expect(bundled.every((track) => track.provider === 'bundled')).toBe(true);
  });

  it('analyzes a candidate without recommending or selecting it', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-music-review-'));
    const analysis = await analyzeMusic(join(import.meta.dirname, '../assets/audio/quiet-precision.wav'), directory);
    expect(analysis.duration).toBeGreaterThan(10);
    expect(analysis.energyCurve.length).toBeGreaterThan(10);
    expect(analysis.integratedLufs).toBeTypeOf('number');
    expect(analysis.usage).toContain('does not recommend');
    await expect(access(analysis.visualReview!.waveform)).resolves.toBeUndefined();
    await expect(access(analysis.visualReview!.spectrogram)).resolves.toBeUndefined();
  });
});

describe('free visual media catalog', () => {
  it('allows permissive licenses and requires explicit opt-in for share-alike media', () => {
    expect(assessFreeLicense('CC0-1.0')).toMatchObject({ selectable: true, requiresAttribution: false });
    expect(assessFreeLicense('CC BY 4.0')).toMatchObject({ selectable: true, requiresAttribution: true });
    expect(assessFreeLicense('CC BY-SA 4.0')).toMatchObject({ selectable: false, requiresShareAlike: true });
    expect(assessFreeLicense('CC BY-SA 4.0', { includeShareAlike: true })).toMatchObject({ selectable: true, requiresShareAlike: true });
    expect(assessFreeLicense('CC BY-NC 4.0').selectable).toBe(false);
    expect(assessFreeLicense('Pexels License')).toMatchObject({ selectable: true, requiresAttribution: false });
  });

  it('normalizes free Pexels stock media without exposing the API key', () => {
    const video = normalizePexelsVideo({
      id: 42, width: 4096, height: 2160, duration: 9, url: 'https://www.pexels.com/video/42/', image: 'https://images.pexels.com/42.jpg',
      user: { name: 'Creator' },
      video_files: [
        { id: 1, file_type: 'video/mp4', width: 1920, height: 1080, link: 'https://cdn.example/hd.mp4' },
        { id: 2, file_type: 'video/mp4', width: 4096, height: 2160, link: 'https://cdn.example/4k.mp4' },
      ],
    });
    const photo = normalizePexelsPhoto({
      id: 7, width: 2400, height: 1600, url: 'https://www.pexels.com/photo/7/', photographer: 'Photographer', alt: 'Team planning',
      src: { original: 'https://images.pexels.com/7.jpg', medium: 'https://images.pexels.com/7-medium.jpg' },
    });
    expect(video).toMatchObject({ provider: 'pexels', kind: 'video', width: 1920, license: 'Pexels License', requiresAttribution: false });
    expect(photo).toMatchObject({ provider: 'pexels', kind: 'image', title: 'Team planning', selectable: true });
  });

  it('searches licensed local videos and assets while excluding unknown-license files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-media-'));
    const video = join(directory, 'software-team.mp4');
    const asset = join(directory, 'abstract-grid.svg');
    const unknown = join(directory, 'unknown.svg');
    await writeFile(video, Buffer.alloc(0));
    await writeFile(`${video}.json`, JSON.stringify({ title: 'Software team planning', license: 'CC BY 4.0', width: 1920, height: 1080, duration: 12, tags: ['team', 'technology'] }));
    await writeFile(asset, '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"/>');
    await writeFile(`${asset}.json`, JSON.stringify({ title: 'Abstract technology grid', license: 'CC0-1.0', width: 1200, height: 800, tags: ['abstract', 'technology'] }));
    await writeFile(unknown, '<svg xmlns="http://www.w3.org/2000/svg"/>');

    const videos = await searchLocalVideos({ directories: [directory], query: 'software team', orientation: 'landscape', minDuration: 8 });
    const assets = await searchLocalAssets({ directories: [directory], query: 'abstract technology', kind: 'svg', minWidth: 1000 });
    expect(videos).toHaveLength(1);
    expect(videos[0]).toMatchObject({ kind: 'video', selectable: true, requiresAttribution: true });
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({ kind: 'svg', selectable: true, requiresAttribution: false });
  });
});

describe('application recording specs', () => {
  it('accepts a recording-only plan and applies safe pointer defaults', () => {
    const parsed = CaptureSpecSchema.parse({
      baseUrl: 'http://localhost:3000',
      outputDir: './captures',
      recordings: [{
        id: 'real-flow',
        path: '/dashboard',
        actions: [
          { type: 'hover', selector: '[data-testid=run]' },
          { type: 'click', selector: '[data-testid=run]' },
          { type: 'wait', ms: 300 },
        ],
      }],
    });
    expect(parsed.targets).toEqual([]);
    expect(parsed.recordings[0]).toMatchObject({ pointer: 'hidden', preRollMs: 500, postRollMs: 800 });
  });

  it('requires at least one screenshot or recording target', () => {
    expect(() => CaptureSpecSchema.parse({ baseUrl: 'http://localhost:3000', outputDir: './captures' })).toThrow(/at least one/);
  });
});

describe('advanced project source', () => {
  it('aggregates clamped progress across isolated renderer workers', () => {
    expect(aggregateWorkerProgress(new Map([[0, 0.5], [1, 0.25]]), 2)).toBe(0.375);
    expect(aggregateWorkerProgress(new Map([[0, 2], [1, -1]]), 2)).toBe(0.5);
    expect(aggregateWorkerProgress(new Map([[1, 0.5]]), 2)).toBe(0.25);
    expect(() => aggregateWorkerProgress(new Map(), 0)).toThrow(/positive integer/);
  });

  it('scaffolds and patches one exact source fragment without recreating the project', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-advanced-'));
    const project = await scaffoldAdvancedProject({ outputDir: directory, name: 'Unique launch' });
    await patchAdvancedProjectFile(directory, 'scene.tsx', [{ find: '// Replace this pause with the authored scene timeline.', replace: '// Authored production timeline begins here.' }]);
    const source = await readFile(project.sceneFile, 'utf8');
    const kinetic = await readFile(join(directory, 'kinetic.ts'), 'utf8');
    const librarySource = await readFile(join(directory, 'motion-library.tsx'), 'utf8');
    const libraryManifest = JSON.parse(await readFile(join(directory, 'motion-library.json'), 'utf8')) as { count: number; components: unknown[] };
    expect(source).toContain('Authored production timeline begins here.');
    expect(source).not.toContain('Motion without templates.');
    expect(source).not.toMatch(/#7c5cff|#6366f1|cards/i);
    await expect(access(join(directory, 'kinetic.ts'))).resolves.toBeUndefined();
    expect(kinetic).toContain('export function impactText');
    expect(kinetic).toContain('export function letterRise');
    expect(kinetic).toContain('export function gradientSweep');
    expect(kinetic).toContain('export function* eraseAndType');
    expect(kinetic).toContain('export function* pushText');
    expect(kinetic).toContain('export function arrangeTextRow');
    expect(librarySource).toContain('export function ProductFrame');
    expect(librarySource).toContain('export function cameraMove');
    expect(libraryManifest.count).toBe(motionComponentLibrary.length);
    expect(libraryManifest.components).toHaveLength(motionComponentLibrary.length);
    expect(motionCapabilities.animation).toContain('text pushing text');
    const listed = await listAdvancedProjectFiles(directory);
    expect(listed.files).toEqual(expect.arrayContaining(['kinetic.ts', 'motion-library.json', 'motion-library.tsx', 'project.tsx', 'scene.tsx']));
    await expect(readAdvancedProjectFile(directory, 'scene.tsx')).resolves.toMatchObject({ source: expect.stringContaining('Authored production timeline begins here.') });
    await expect(readAdvancedProjectFile(directory, '../outside.ts')).rejects.toThrow(/stay inside/);
  });

  it('searches a broad component vocabulary by intent without returning a default template', () => {
    expect(motionComponentLibrary.length).toBeGreaterThanOrEqual(50);
    expect(searchMotionComponents({ query: 'interface assembly' }).map((item) => item.id)).toContain('interface-assembly');
    expect(searchMotionComponents({ query: 'camera follows the assembling navigation' }).map((item) => item.id)).toContain('interface-assembly');
    const cameras = searchMotionComponents({ categories: ['camera'], energy: ['impact'], limit: 20 });
    expect(cameras.length).toBeGreaterThan(0);
    expect(cameras.every((item) => item.category === 'camera' && item.energy.includes('impact'))).toBe(true);
  });
});

describe('universal client installation', () => {
  it('selects clients and safety flags from one npx-compatible command', () => {
    expect(parseInstallArgs(['install']).clients).toEqual(['codex', 'claude-code', 'claude-desktop', 'cursor']);
    expect(parseInstallArgs(['install', '--clients', 'codex,cursor', '--dry-run'])).toMatchObject({
      clients: ['codex', 'cursor'], dryRun: true, skipBrowser: false,
    });
    expect(parseInstallArgs(['install', '--clients', 'claude'])).toMatchObject({ clients: ['claude-code', 'claude-desktop'] });
    expect(parseInstallArgs(['install', '--clients', 'claude-code'])).toMatchObject({ clients: ['claude-code'] });
    expect(parseInstallArgs(['install', '--clients', 'claude-desktop'])).toMatchObject({ clients: ['claude-desktop'] });
    expect(() => parseInstallArgs(['--clients', 'unknown'])).toThrow(/accepts codex/);
  });

  it('uses native Windows user locations for runtimes, Skills, and MCP configuration', () => {
    const home = 'C:\\Users\\Helio';
    const env = {
      LOCALAPPDATA: 'C:\\Users\\Helio\\AppData\\Local',
      APPDATA: 'C:\\Users\\Helio\\AppData\\Roaming',
    };
    expect(defaultRuntimeDir(home, 'win32', env)).toBe('C:\\Users\\Helio\\AppData\\Local\\ai-promo-video');
    expect(defaultRuntimeDir(home, 'win32', {})).toBe('C:\\Users\\Helio\\AppData\\Local\\ai-promo-video');
    expect(clientSkillDestination(home, 'codex', 'win32')).toBe('C:\\Users\\Helio\\.agents\\skills\\create-ai-promo-video');
    expect(clientSkillDestination(home, 'claude-code', 'win32')).toBe('C:\\Users\\Helio\\.claude\\skills\\create-ai-promo-video');
    expect(clientSkillDestination(home, 'cursor', 'win32')).toBe('C:\\Users\\Helio\\.cursor\\skills\\create-ai-promo-video');
    expect(clientMcpConfigPath(home, 'codex', 'win32')).toBe('C:\\Users\\Helio\\.codex\\config.toml');
    expect(clientMcpConfigPath(home, 'claude-code', 'win32')).toBe('C:\\Users\\Helio\\.claude.json');
    expect(clientMcpConfigPath(home, 'cursor', 'win32')).toBe('C:\\Users\\Helio\\.cursor\\mcp.json');
    expect(defaultClaudeDesktopConfigPath(home, 'win32', env)).toBe('C:\\Users\\Helio\\AppData\\Roaming\\Claude\\claude_desktop_config.json');
    expect(windowsClaudeDesktopStoreConfigPath(env.LOCALAPPDATA, 'Claude_pzs8sxrjxfjjc')).toBe(
      'C:\\Users\\Helio\\AppData\\Local\\Packages\\Claude_pzs8sxrjxfjjc\\LocalCache\\Roaming\\Claude\\claude_desktop_config.json',
    );
  });

  it('keeps native Windows and WSL installations in their respective homes', () => {
    expect(defaultRuntimeDir('/home/helio', 'linux', {})).toBe('/home/helio/.local/share/ai-promo-video');
    expect(clientMcpConfigPath('/home/helio', 'codex', 'linux')).toBe('/home/helio/.codex/config.toml');
    expect(defaultClaudeDesktopConfigPath('/Users/helio', 'darwin', {})).toBe('/Users/helio/Library/Application Support/Claude/claude_desktop_config.json');
  });

  it('deduplicates where.exe results case-insensitively while retaining cmd and exe launchers', () => {
    expect(parseWindowsWhereOutput([
      'C:\\Users\\Helio\\AppData\\Roaming\\npm\\claude.cmd',
      'c:\\users\\helio\\appdata\\roaming\\npm\\CLAUDE.CMD',
      'C:\\Program Files\\Claude\\claude.exe',
      '',
    ].join('\r\n'))).toEqual([
      'C:\\Users\\Helio\\AppData\\Roaming\\npm\\claude.cmd',
      'C:\\Program Files\\Claude\\claude.exe',
    ]);
    expect(windowsCommandNeedsShell('C:\\Users\\Helio\\AppData\\Roaming\\npm\\claude.cmd')).toBe(true);
    expect(windowsCommandNeedsShell('C:\\Program Files\\Claude\\claude.exe')).toBe(false);
  });
});

describe('delivery cleanup', () => {
  it('keeps verified final deliverables and removes only sibling intermediates', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-delivery-'));
    await writeFile(join(directory, 'final.mp4'), 'final');
    await writeFile(join(directory, 'silent.mp4'), 'temporary');
    await mkdir(join(directory, 'review'));
    await writeFile(join(directory, 'review', 'overview.png'), 'temporary');
    const result = await cleanDeliveryOutput(directory, ['final.mp4']);
    expect(result).toMatchObject({ kept: ['final.mp4'], removed: ['review', 'silent.mp4'] });
    await expect(access(join(directory, 'final.mp4'))).resolves.toBeUndefined();
    await expect(access(join(directory, 'silent.mp4'))).rejects.toThrow();
  });
});

describe('capture image editing', () => {
  it('creates a derived asset and leaves the original untouched', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-image-'));
    const input = join(directory, 'source.ppm');
    const output = join(directory, 'derived.png');
    const source = Buffer.from('P3\n1 1\n255\n255 255 255\n', 'utf8');
    await writeFile(input, source);
    const result = await editImage({ input, output, resize: { width: 32, height: 32, fit: 'stretch', background: '#000000' } });
    await access(result.outputPath);
    expect(await readFile(input)).toEqual(source);
    expect(result.filters).toContain('scale=32:32');
  });
});
