import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listAdvancedProjectFiles, motionCapabilities, patchAdvancedProjectFile, readAdvancedProjectFile, renderAdvancedProject, scaffoldAdvancedProject } from '../src/advanced/engine.js';
import { validateAdvancedProjectSource, validateRevideoSceneSource } from '../src/advanced/source-validation.js';
import {AdvancedTypecheckError, validateAdvancedProjectTypes} from '../src/advanced/typecheck.js';
import {rendererFailureReport, serializeAdvancedError} from '../src/advanced/diagnostics.js';
import { flattenSceneNodes } from '../assets/revideo-template/scene-tree.js';
import { listAudioTracks } from '../src/audio/catalog.js';
import { analyzeMusic } from '../src/audio/analyze.js';
import { searchLocalMusic } from '../src/audio/search.js';
import { motionComponentLibrary, searchMotionComponents } from '../src/advanced/library.js';
import { resolveVideoFormat } from '../src/advanced/formats.js';
import { prepareCaptionTiming, reviewCaptionTiming } from '../src/captions/timing.js';
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
  runtimeEntries,
  windowsClaudeDesktopStoreConfigPath,
  windowsCommandNeedsShell,
} from '../src/install.js';
import { aggregateWorkerProgress } from '../src/advanced/render-protocol.js';
import { getContextualHelp, toolHelpEntries } from '../src/help/catalog.js';
import { attachSourceContracts, sourceApiContracts } from '../src/help/source-contract.js';

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
    const project = await scaffoldAdvancedProject({ outputDir: directory, name: 'Unique launch', format: 'portrait', platform: 'tiktok' });
    await patchAdvancedProjectFile(directory, 'scene.tsx', [{ find: '// Replace this pause with the authored scene timeline.', replace: '// Authored production timeline begins here.' }]);
    const source = await readFile(project.sceneFile, 'utf8');
    const kinetic = await readFile(join(directory, 'kinetic.ts'), 'utf8');
    const librarySource = await readFile(join(directory, 'motion-library.tsx'), 'utf8');
    const captionSource = await readFile(join(directory, 'captions.tsx'), 'utf8');
    const formatSource = await readFile(join(directory, 'format.tsx'), 'utf8');
    const proceduralSource = await readFile(join(directory, 'procedural.tsx'), 'utf8');
    const ambientSource = await readFile(join(directory, 'ambient.ts'), 'utf8');
    const sceneTreeSource = await readFile(join(directory, 'scene-tree.ts'), 'utf8');
    const transitionSource = await readFile(join(directory, 'transitions.ts'), 'utf8');
    const cameraSource = await readFile(join(directory, 'camera.ts'), 'utf8');
    const vectorSource = await readFile(join(directory, 'vector-motion.ts'), 'utf8');
    const threeEffectsSource = await readFile(join(directory, 'three-effects.ts'), 'utf8');
    const opticalGlassSource = await readFile(join(directory, 'optical-glass.tsx'), 'utf8');
    const opticalGlassShader = await readFile(join(directory, 'optical-glass.glsl'), 'utf8');
    const liquidGlassTextSource = await readFile(join(directory, 'liquid-glass-text.tsx'), 'utf8');
    const liquidGlassTextShader = await readFile(join(directory, 'liquid-glass-text.glsl'), 'utf8');
    const formatProfile = JSON.parse(await readFile(join(directory, 'format-profile.json'), 'utf8')) as { width: number; height: number; platform: string; safeAreaPixels: { right: number } };
    const libraryManifest = JSON.parse(await readFile(join(directory, 'motion-library.json'), 'utf8')) as { count: number; components: unknown[] };
    expect(source).toContain('Authored production timeline begins here.');
    expect(source).not.toContain('Motion without templates.');
    expect(source).not.toMatch(/#7c5cff|#6366f1|cards/i);
    await expect(access(join(directory, 'kinetic.ts'))).resolves.toBeUndefined();
    expect(kinetic).toContain('export function impactText');
    expect(kinetic).toContain('export function prepareTrackReveal');
    expect(kinetic).toContain('export function playTrackReveal');
    expect(kinetic).toContain('export function letterRise');
    expect(kinetic).toContain('export function gradientSweep');
    expect(kinetic).toContain('export function* specularTextSweep');
    expect(kinetic).toContain('export function* eraseAndType');
    expect(kinetic).toContain('export function* pushText');
    expect(kinetic).toContain('export function arrangeTextRow');
    expect(librarySource).toContain('export function ProductFrame');
    expect(librarySource).toContain('export function cameraMove');
    expect(librarySource).toContain('export function SpecularTextStack');
    expect(captionSource).toContain('export function* playWordFollowCaption');
    expect(formatSource).toContain('export function PortraitProductStage');
    expect(proceduralSource).toContain('export function FlowField');
    expect(ambientSource).toContain('export function* ambientDrift');
    expect(ambientSource).toContain('export function ambientCamera');
    expect(ambientSource).toContain('export function* ambientParallax');
    expect(ambientSource).toContain('export function runWithAmbientMotion');
    expect(sceneTreeSource).toContain('export function flattenSceneNodes');
    expect(sceneTreeSource).toContain('export function mapSceneNodes');
    expect(sceneTreeSource).toContain('export function assertSceneNodeMounted');
    for (const name of ['directionalPush', 'zoomThrough', 'shapeWipe', 'objectCarry', 'directionalBlurCut', 'matchScale', 'organicMorphWipe', 'sharedElementBridge', 'whipPanBridge', 'displacementReveal']) {
      expect(transitionSource).toContain(`export function* ${name}`);
    }
    for (const name of ['dollyIn', 'orbitSweep', 'focusTrack', 'perspectiveTilt', 'cameraPath']) {
      expect(cameraSource).toContain(`export function* ${name}`);
    }
    for (const name of ['ambientCameraRig', 'ambientParallaxRig', 'parallaxPan']) {
      expect(cameraSource).toContain(`export function ${name}`);
    }
    expect(vectorSource).toContain('export function* morphVectorPath');
    expect(threeEffectsSource).toContain('export function createPostProcessing');
    expect(opticalGlassSource).toContain('export function OpticalGlass');
    expect(opticalGlassShader).toContain('destinationTexture');
    expect(liquidGlassTextSource).toContain('export function LiquidGlassText');
    expect(liquidGlassTextShader).toContain('glyphMask');
    expect(liquidGlassTextShader).toContain('destinationTexture');
    expect(formatProfile).toMatchObject({ width: 1080, height: 1920, platform: 'tiktok' });
    expect(formatProfile.safeAreaPixels.right).toBeGreaterThan(0);
    expect(project.formatProfile).toMatchObject({ id: 'portrait', width: 1080, height: 1920, platform: 'tiktok' });
    expect(validateAdvancedProjectTypes(project.projectFile)).toMatchObject({valid: true, diagnostics: []});
    expect(libraryManifest.count).toBe(motionComponentLibrary.length);
    expect(libraryManifest.components).toHaveLength(motionComponentLibrary.length);
    expect(motionCapabilities.animation).toContain('text pushing text');
    const listed = await listAdvancedProjectFiles(directory);
    expect(listed.files).toEqual(expect.arrayContaining(['ambient.ts', 'camera.ts', 'captions.tsx', 'format-profile.json', 'format.tsx', 'kinetic.ts', 'liquid-glass-text.glsl', 'liquid-glass-text.tsx', 'motion-library.json', 'motion-library.tsx', 'optical-glass.glsl', 'optical-glass.tsx', 'procedural.tsx', 'project.tsx', 'scene-tree.ts', 'scene.tsx', 'three-effects.ts', 'transitions.ts', 'vector-motion.ts']));
    await expect(readAdvancedProjectFile(directory, 'scene.tsx')).resolves.toMatchObject({ source: expect.stringContaining('Authored production timeline begins here.') });
    await expect(readAdvancedProjectFile(directory, '../outside.ts')).rejects.toThrow(/stay inside/);
  });

  it('recursively flattens scene-node collections without requiring a Revideo scene context', () => {
    const first = {id: 'first'} as never;
    const second = {id: 'second'} as never;
    expect(flattenSceneNodes([first, [false, null, [second]]])).toEqual([first, second]);
  });

  it('blocks Revideo 0.11 nested JSX collections before renderer startup', async () => {
    const directFragment = `view.add(<>{items.map(item => <><Rect /><Txt text={item} /></>)}</>);`;
    const blockFragment = `view.add(<>{items.map(item => { return (<><Rect /><Txt text={item} /></>); })}</>);`;
    const jsxArray = `view.add(<>{items.map(item => [<Rect />, <Txt text={item} />])}</>);`;
    const safeDirectMaps = `view.add(<>{items.map(() => <Rect />)}{items.map(item => <Txt text={item} />)}</>);`;
    const safeFlatMap = `view.add(items.flatMap(item => <><Rect /><Txt text={item} /></>));`;
    expect(validateRevideoSceneSource(directFragment)[0]).toMatchObject({code: 'REV011_NESTED_JSX_FRAGMENT_MAP', line: 1, helpTarget: 'topic:revideo-scene-tree'});
    expect(validateRevideoSceneSource(blockFragment)[0]).toMatchObject({code: 'REV011_NESTED_JSX_FRAGMENT_MAP'});
    expect(validateRevideoSceneSource(jsxArray)[0]).toMatchObject({code: 'REV011_NESTED_JSX_ARRAY_MAP'});
    expect(validateRevideoSceneSource(safeDirectMaps)).toEqual([]);
    expect(validateRevideoSceneSource(safeFlatMap)).toEqual([]);
    expect(validateRevideoSceneSource(`// ${directFragment}\nconst example = "${directFragment.replaceAll('"', '\\"')}";`)).toEqual([]);

    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-scene-tree-'));
    const projectFile = join(directory, 'project.tsx');
    await writeFile(projectFile, `export default {};`);
    await writeFile(join(directory, 'scene.tsx'), `\n${directFragment}\n`);
    const validation = await validateAdvancedProjectSource(projectFile);
    expect(validation).toMatchObject({valid: false, filesChecked: ['project.tsx', 'scene.tsx']});
    expect(validation.issues[0]).toMatchObject({file: 'scene.tsx', line: 2});
    await expect(renderAdvancedProject({projectFile, output: join(directory, 'should-not-render.mp4')})).rejects.toThrow(/REV011_NESTED_JSX_FRAGMENT_MAP/);
  });

  it('catches invalid names, imports, and exports before renderer startup with code frames', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-typecheck-'));
    const projectFile = join(directory, 'project.tsx');
    await writeFile(projectFile, `/** @jsxImportSource @revideo/2d/lib */
import {makeProject, notARealExport} from '@revideo/core';
import scene from './scene';
import missing from './missing-helper';
void notARealExport;
void missing;
void MissingTimelineName;
export default makeProject({scenes: [scene]});
`);
    await writeFile(join(directory, 'scene.tsx'), `/** @jsxImportSource @revideo/2d/lib */
import {makeScene2D} from '@revideo/2d';
export default makeScene2D('test', function* () {});
`);

    const validation = validateAdvancedProjectTypes(projectFile);
    expect(validation.valid).toBe(false);
    expect(validation.elapsedMs).toBeLessThan(5_000);
    expect(validation.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(expect.arrayContaining(['TS2305', 'TS2307', 'TS2304']));
    expect(validation.diagnostics.every((diagnostic) => diagnostic.file === projectFile && diagnostic.line && diagnostic.column && diagnostic.codeFrame?.includes('^'))).toBe(true);

    let failure: unknown;
    try {
      await renderAdvancedProject({projectFile, output: join(directory, 'should-not-render.mp4')});
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(AdvancedTypecheckError);
    expect(serializeAdvancedError(failure)).toMatchObject({
      ok: false,
      phase: 'preflight',
      diagnostics: expect.arrayContaining([expect.objectContaining({code: 'TS2307', relativeFile: 'project.tsx'})]),
    });
  });

  it('turns renderer stacks into structured source diagnostics', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-runtime-error-'));
    const projectFile = join(directory, 'project.tsx');
    const sceneFile = join(directory, 'scene.tsx');
    await writeFile(projectFile, 'export default {};\n');
    await writeFile(sceneFile, `const first = 1;\nthrow new Error('broken frame');\nconst last = 3;\n`);
    const report = rendererFailureReport(
      'Advanced renderer failed: broken frame',
      `Error: broken frame\n    at scene (http://localhost:9000/scene.tsx:1:7)`,
      projectFile,
    );
    expect(report).toMatchObject({
      ok: false,
      phase: 'renderer',
      diagnostics: [expect.objectContaining({
        code: 'REVIDEO_RUNTIME',
        file: sceneFile,
        relativeFile: 'scene.tsx',
        line: 2,
        column: 18,
      })],
    });
    expect(report.diagnostics[0].codeFrame).toContain(`> 2 | throw new Error('broken frame');`);
    expect(report.diagnostics[0].codeFrame).toContain('^');
  });

  it('searches a broad component vocabulary by intent without returning a default template', () => {
    expect(motionComponentLibrary.length).toBeGreaterThanOrEqual(80);
    expect(searchMotionComponents({ query: 'interface assembly' }).map((item) => item.id)).toContain('interface-assembly');
    expect(searchMotionComponents({ query: 'camera follows the assembling navigation' }).map((item) => item.id)).toContain('interface-assembly');
    const cameras = searchMotionComponents({ categories: ['camera'], energy: ['impact'], limit: 20 });
    expect(cameras.length).toBeGreaterThan(0);
    expect(cameras.every((item) => item.category === 'camera' && item.energy.includes('impact'))).toBe(true);
    expect(searchMotionComponents({ query: 'vertical captions follow spoken words' }).map((item) => item.id)).toContain('word-follow-caption');
    expect(searchMotionComponents({ query: 'portrait product safe area' }).map((item) => item.id)).toContain('portrait-product-stage');
    expect(searchMotionComponents({ query: 'specular light crossing text' }).map((item) => item.id)).toContain('specular-text-sweep');
    expect(searchMotionComponents({ query: 'continuous camera movement through the whole shot' }).map((item) => item.id)).toContain('ambient-camera-rig');
    expect(searchMotionComponents({ query: 'background continuously drifting while the scene plays' }).map((item) => item.id)).toContain('continuous-ambient-field');
    expect(searchMotionComponents({ query: 'optical liquid glass refraction' }).map((item) => item.id)).toContain('optical-liquid-glass');
    expect(searchMotionComponents({ query: 'liquid glass text refraction' }).map((item) => item.id)).toContain('liquid-glass-text');
    const transitionEntries = motionComponentLibrary.filter((item) => item.category === 'transition');
    const cameraEntries = motionComponentLibrary.filter((item) => item.category === 'camera');
    expect(transitionEntries).toHaveLength(10);
    expect(cameraEntries).toHaveLength(7);
    expect(transitionEntries.every((item) => item.sourceExports.every((name) => name !== 'cameraMove'))).toBe(true);
    expect(cameraEntries.every((item) => item.sourceExports.every((name) => name !== 'cameraMove'))).toBe(true);
  });
});

describe('progressive contextual help', () => {
  it('keeps the index compact and loads calibrated component detail only on demand', () => {
    const index = getContextualHelp() as { mode: string; counts: { tools: number; components: number }; topics: unknown[]; help?: unknown };
    expect(index.mode).toBe('index');
    expect(index.counts.tools).toBe(toolHelpEntries.length);
    expect(index.counts.components).toBe(motionComponentLibrary.length);
    expect(index).not.toHaveProperty('help');

    const result = getContextualHelp({ target: 'component:liquid-glass-text' }) as {
      mode: string;
      help: { contractLevel: string; parameters: Record<string, { default?: unknown; recommended?: string }>; pitfalls: string[] };
    };
    expect(result.mode).toBe('detail');
    expect(result.help.contractLevel).toBe('calibrated');
    expect(result.help.parameters.refraction).toMatchObject({ default: 0.038 });
    expect(result.help.parameters.refraction.recommended).toContain('0.035');
    expect(result.help.parameters.phase.recommended).toContain('continuously');
    expect(result.help.pitfalls.join(' ')).toContain('constant phase');
  });

  it('supports compact search and treats transition help as a continuity contract', () => {
    const search = getContextualHelp({ query: 'liquid glass text', limit: 4 }) as { mode: string; results: Array<{ target: string; summary: string; parameters?: unknown }> };
    expect(search.mode).toBe('search');
    expect(search.results.map((entry) => entry.target)).toContain('component:liquid-glass-text');
    expect(search.results.every((entry) => !('parameters' in entry))).toBe(true);

    const transition = getContextualHelp({ kind: 'transition', id: 'camera-zoom-through' }) as {
      mode: string;
      help: { kind: string; workflow: string[]; validation: string[] };
    };
    expect(transition.mode).toBe('detail');
    expect(transition.help.kind).toBe('transition');
    expect(transition.help.workflow.join(' ')).toContain('overlap');
    expect(transition.help.validation.join(' ')).toContain('first settled destination frame');
  });

  it('promotes target-shaped queries and normalizes MCP ids in free-text search', () => {
    const promoted = getContextualHelp({query: 'tool:scaffold_advanced_video'}) as {
      mode: string; target: string; help: {id: string; parameters: Record<string, unknown>};
    };
    expect(promoted).toMatchObject({mode: 'detail', target: 'tool:scaffold_advanced_video'});
    expect(promoted.help.id).toBe('scaffold_advanced_video');
    expect(promoted.help.parameters).toHaveProperty('outputDir');

    const tolerantTarget = getContextualHelp({target: 'tool:scaffold-advanced-video'}) as {mode: string; target: string};
    expect(tolerantTarget).toMatchObject({mode: 'detail', target: 'tool:scaffold_advanced_video'});

    const freeSearch = getContextualHelp({query: 'scaffold_advanced_video', limit: 4}) as {mode: string; results: Array<{target: string}>};
    expect(freeSearch.mode).toBe('search');
    expect(freeSearch.results.map((entry) => entry.target)).toContain('tool:scaffold_advanced_video');

    const missing = getContextualHelp({query: 'tool:not_a_real_tool'}) as {mode: string; requested: string; suggestions: unknown[]};
    expect(missing).toMatchObject({mode: 'not-found', requested: 'tool:not_a_real_tool'});
    expect(missing.suggestions.length).toBeGreaterThan(0);
  });

  it('loads Revideo scene-tree safety only through exact contextual help', async () => {
    const compact = getContextualHelp({query: 'detached fragment scene tree', limit: 4}) as {results: Array<{target: string; example?: string}>};
    expect(compact.results.map((entry) => entry.target)).toContain('topic:revideo-scene-tree');
    expect(compact.results.every((entry) => !('example' in entry))).toBe(true);

    const detailed = await attachSourceContracts(getContextualHelp({target: 'topic:revideo-scene-tree'})) as {
      help: {pitfalls: string[]; example: string; sourceContracts: Array<{sourceFile: string; exportName: string}>};
    };
    expect(detailed.help.pitfalls.join(' ')).toContain('parent() === null');
    expect(detailed.help.example).toContain('mapSceneNodes');
    expect(detailed.help.sourceContracts).toHaveLength(5);
    expect(detailed.help.sourceContracts.every((contract) => contract.sourceFile === 'scene-tree.ts')).toBe(true);
  });

  it('documents every MCP tool registered by the server', async () => {
    const serverSource = await readFile(new URL('../src/mcp/server.ts', import.meta.url), 'utf8');
    const registered = [...serverSource.matchAll(/server\.registerTool\('([^']+)'/g)].map((match) => match[1]).sort();
    expect(toolHelpEntries.map((entry) => entry.id).sort()).toEqual(registered);
  });

  it('attaches exact shipped type declarations, signatures, and runtime defaults on detail calls', async () => {
    const contracts = await sourceApiContracts(['LiquidGlassText', 'cameraMove', 'whipPanBridge', 'orbitSweep', 'customEscapeHatch']);
    expect(contracts[0]).toMatchObject({ exportName: 'LiquidGlassText', sourceFile: 'liquid-glass-text.tsx' });
    expect(contracts[0].typeDeclaration).toContain('LiquidGlassTextProps');
    expect(contracts[0].callSignature).toContain('refraction = 0.038');
    expect(contracts[1].typeDeclaration).toContain('CameraMoveOptions');
    expect(contracts[2]).toMatchObject({sourceFile: 'transitions.ts'});
    expect(contracts[2].typeDeclaration).toContain('WhipPanBridgeOptions');
    expect(contracts[3]).toMatchObject({sourceFile: 'camera.ts'});
    expect(contracts[3].typeDeclaration).toContain('OrbitSweepOptions');
    expect(contracts[4].note).toContain('composition recipe');

    const detailed = await attachSourceContracts(getContextualHelp({ target: 'component:liquid-glass-text' })) as {
      help: { sourceContracts: Array<{ sourceFile: string }> };
    };
    expect(detailed.help.sourceContracts[0].sourceFile).toBe('liquid-glass-text.tsx');
  });
});

describe('adaptive formats and captions', () => {
  it('resolves a vertical social composition with editable platform safe areas', () => {
    const profile = resolveVideoFormat({ format: 'portrait', platform: 'instagram-reels' });
    expect(profile).toMatchObject({ id: 'portrait', width: 1080, height: 1920, aspectRatio: '9:16', platform: 'instagram-reels' });
    expect(profile.safeAreaPixels.bottom).toBe(Math.round(1920 * profile.safeArea.bottom));
    expect(resolveVideoFormat({ width: 1200, height: 1200 }).id).toBe('square');
    expect(() => resolveVideoFormat({ safeArea: { left: 0.5 } })).toThrow(/safeArea.left/);
  });

  it('parses cue captions, labels interpolation honestly, and writes reviewable timing JSON', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-captions-'));
    const input = join(directory, 'captions.srt');
    const output = join(directory, 'caption-timing.json');
    await writeFile(input, '1\n00:00:00,000 --> 00:00:02,000\nSua ideia ganha movimento.\n');
    const document = await prepareCaptionTiming({ inputPath: input, outputPath: output });
    expect(document).toMatchObject({ precision: 'cue-interpolated', duration: 2, outputPath: output });
    expect(document.cues[0].words.map((word) => word.text)).toEqual(['Sua', 'ideia', 'ganha', 'movimento.']);
    expect(document.qa.metrics.approximateWords).toBe(4);
    expect(document.qa.issues.map((issue) => issue.code)).toContain('approximate-word-timing');
    await expect(reviewCaptionTiming(output)).resolves.toMatchObject({ passed: true, metrics: { approximateWords: 4 } });
  });

  it('preserves supplied word-exact timing instead of reclassifying it as interpolation', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ai-promo-word-timing-'));
    const input = join(directory, 'exact.json');
    const output = join(directory, 'normalized.json');
    await writeFile(input, JSON.stringify({ cues: [{
      id: 'line-1', start: 0, end: 1.2, text: 'Move com intenção', precision: 'word-exact',
      words: [
        { text: 'Move', start: 0, end: 0.35 },
        { text: 'com', start: 0.35, end: 0.65 },
        { text: 'intenção', start: 0.65, end: 1.2 },
      ],
    }] }));
    const document = await prepareCaptionTiming({ inputPath: input, outputPath: output });
    expect(document.precision).toBe('word-exact');
    expect(document.qa.metrics.approximateWords).toBe(0);
    await expect(reviewCaptionTiming(output)).resolves.toMatchObject({ passed: true, metrics: { approximateWords: 0 } });
  });
});

describe('universal client installation', () => {
  it('keeps the GitHub npx bootstrap free of runtime-only postinstall hooks', async () => {
    const rootPackage = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8')) as { scripts?: Record<string, string> };
    const runtimePackage = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as { scripts?: Record<string, string> };
    expect(rootPackage.scripts).not.toHaveProperty('postinstall');
    expect(runtimePackage.scripts?.postinstall).toBe('node scripts/apply-revideo-patches.mjs');
    expect(runtimeEntries).toContain('scripts');
  });

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
