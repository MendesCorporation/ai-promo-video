#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ContentBlock } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { generateAudioLibrary } from '../audio/generate-library.js';
import { listAudioTracks } from '../audio/catalog.js';
import { analyzeMusic } from '../audio/analyze.js';
import { downloadOpenverseMusic } from '../audio/openverse.js';
import { searchMusic } from '../audio/search.js';
import { captureFromSpecFile, inspectSite, recordFromSpecFile } from '../capture/capture.js';
import { createVisualReviewPack, extractReviewFrames, probeVideo } from '../render/probe.js';
import { renderFromSpecFile } from '../render/renderer.js';
import { validateSpec } from '../commands.js';
import { addAdvancedVideoHelpers, advancedVideoHelperIds, listAdvancedProjectFiles, motionCapabilities, patchAdvancedProjectFile, readAdvancedProjectFile, renderAdvancedProject, saveAdvancedProjectFile, scaffoldAdvancedProject } from '../advanced/engine.js';
import { motionComponentCategories, motionComponentLibrary, motionLibrarySummary, searchMotionComponents } from '../advanced/library.js';
import { platformTargets, resolveVideoFormat, videoFormatIds, videoFormatProfiles } from '../advanced/formats.js';
import { validateMotionPlan } from '../advanced/motion-plan.js';
import { prepareCaptionTiming, reviewCaptionTiming } from '../captions/timing.js';
import { editImage, editVideo, mixMusic, replaceVideoRange } from '../media/edit.js';
import { cleanDeliveryOutput } from '../media/cleanup.js';
import { downloadFreeAsset, downloadFreeVideo, searchFreeAssets, searchFreeVideos } from '../library/search.js';
import { getContextualHelp, helpKinds } from '../help/catalog.js';
import { attachSourceContracts } from '../help/source-contract.js';
import {serializeAdvancedError} from '../advanced/diagnostics.js';

const skillDirectory = fileURLToPath(new URL('../../skills/create-ai-promo-video/', import.meta.url));
const directorGuide = await readFile(join(skillDirectory, 'SKILL.md'), 'utf8');
const referenceNames = [
  'advanced-motion',
  'vertical-and-captions',
  'component-library',
  'capture-spec',
  'free-media-sourcing',
  'motion-quality',
  'music-sourcing',
  'revision-workflow',
  'story-direction',
  'video-spec',
] as const;

const server = new McpServer({
  name: 'ai-promo-video',
  version: '0.6.4',
}, {
  capabilities: { logging: {} },
  instructions: 'Create professional, custom motion-design films rather than raw screen recordings or slide decks. Every short production uses one master Revideo engine scene with modular logical shots: scaffold the minimal project, search the motion component library, add only the selected source groups with add_advanced_video_helpers, combine only story-relevant primitives, and author custom TypeScript in the same composition whenever needed. Complete motion-plan.json before authoring; declare every non-final boundary as continuous, motivated-cut, or intentional-stop; call validate_motion_plan before the first render; preserve focal velocity through multi-beat moves unless stillness is intentional; and register critical refs for render-only overflow, collision, and optical-centering review. Compose portrait and square formats intentionally instead of shrinking 16:9 scenes. When speech captions are requested, prepare timing, distinguish exact timestamps from interpolation, respect platform safe areas, and review settled caption frames. probe_video distinguishes audible hasAudio from technical hasAudioStream and audioIsSilent. The JSON renderer is legacy compatibility, never a draft template for a new production. Do not select bundled music by default; search by explicit musical intent, prioritize Freesound through Openverse, and compare candidates from multiple licensed sources. Aggregate Pexels, Pixabay, Openverse, Wikimedia, and approved local media for footage and assets when available. Use the help tool only at the point of uncertainty: search compactly, then request one exact tool, component, transition, or topic for parameter values, constraints, examples, pitfalls, and validation. Before delivery: preserve license metadata, create the visual review pack with the project, motion plan, and render variables; inspect every exact evidence and settle frame plus every overview/transition sheet; classify candidates as intentional or material; correct material anomalies; probe again; then call clean_delivery_output with independent projectDir/outputDir. External outputs default to shared and never lose sibling files; owned is only for dedicated delivery directories. For the complete workflow, read ai-promo://director-guide, invoke the create-ai-promo-video prompt, or call load_director_guide when the client exposes only MCP tools.',
});

function response(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResponse(error: unknown) {
  return {
    isError: true as const,
    content: [{type: 'text' as const, text: JSON.stringify(serializeAdvancedError(error), null, 2)}],
  };
}

server.registerResource('ai-promo-director-guide', 'ai-promo://director-guide', {
  title: 'AI Promo Video Director Guide',
  description: 'Complete professional directing workflow shared by Codex, Claude, Cursor, and other MCP clients.',
  mimeType: 'text/markdown',
}, async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: directorGuide }] }));

server.registerResource('ai-promo-motion-library', 'ai-promo://motion-library', {
  title: 'AI Promo Video Motion Component Library',
  description: 'Searchable, non-prescriptive vocabulary of reusable motion systems available in every scaffolded Revideo composition.',
  mimeType: 'application/json',
}, async (uri) => ({ contents: [{
  uri: uri.href,
  mimeType: 'application/json',
  text: JSON.stringify({ ...motionLibrarySummary, components: motionComponentLibrary }, null, 2),
}] }));

for (const referenceName of referenceNames) {
  server.registerResource(`ai-promo-${referenceName}`, `ai-promo://references/${referenceName}`, {
    title: `AI Promo Video Reference: ${referenceName}`,
    description: `Detailed ${referenceName} guidance for professional promo production.`,
    mimeType: 'text/markdown',
  }, async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'text/markdown',
      text: await readFile(join(skillDirectory, 'references', `${referenceName}.md`), 'utf8'),
    }],
  }));
}

server.registerPrompt('create-ai-promo-video', {
  title: 'Create a professional AI promo video',
  description: 'Load the director workflow and start a fully headless, licensed, visually reviewed promo production.',
  argsSchema: {
    brief: z.string().min(1),
    productUrl: z.string().optional(),
    durationSeconds: z.string().optional(),
  },
}, async ({ brief, productUrl, durationSeconds }) => ({
  description: 'Professional AI promo video direction brief',
  messages: [{
    role: 'user',
    content: {
      type: 'text',
      text: `${directorGuide}\n\n## Current production brief\n\n${brief}${productUrl ? `\n\nProduct URL: ${productUrl}` : ''}${durationSeconds ? `\nTarget duration: ${durationSeconds} seconds` : ''}`,
    },
  }],
}));

server.registerTool('load_director_guide', {
  title: 'Load AI Promo Video Director Guide',
  description: 'Load the complete create-ai-promo-video Skill workflow before planning a production. Use this first when the host client exposes MCP tools but does not discover filesystem Skills, prompts, or resources, such as Claude Desktop Home.',
  inputSchema: {},
}, async () => ({ content: [{ type: 'text' as const, text: directorGuide }] }));

server.registerTool('help', {
  title: 'AI Promo Video Contextual Help',
  description: 'Progressively load detailed documentation for one exact MCP tool, motion component, transition, or production topic. Call without arguments for a compact index, with query for short candidates, then with target kind:id (or kind plus id) for complete parameters, values, constraints, examples, pitfalls, and validation. For tolerance, query values already shaped as kind:id are promoted automatically to exact target lookups.',
  inputSchema: {
    target: z.string().min(1).optional(),
    kind: z.enum(helpKinds).optional(),
    id: z.string().min(1).optional(),
    query: z.string().min(1).optional(),
    limit: z.number().int().min(1).max(30).default(12),
  },
}, async (options) => response(await attachSourceContracts(getContextualHelp(options))));

server.registerTool('inspect_saas', {
  title: 'Inspect SaaS',
  description: 'Inspect a SaaS page for title, messaging, headings, dominant colors, and an optional screenshot.',
  inputSchema: {
    url: z.string().url(),
    screenshotPath: z.string().optional(),
  },
}, async ({ url, screenshotPath }) => response(await inspectSite(url, screenshotPath)));

server.registerTool('capture_saas', {
  title: 'Capture SaaS Screens',
  description: 'Run an authenticated Playwright asset plan and save clean product screenshots and/or application recordings plus a manifest.',
  inputSchema: { specPath: z.string().min(1) },
}, async ({ specPath }) => response(await captureFromSpecFile(specPath)));

server.registerTool('record_saas_flows', {
  title: 'Record SaaS Flows',
  description: 'Record authenticated application interactions as clean, high-quality MP4 clips controlled by the AI. Supports click, fill, press, hover, select, check, scroll, mouse movement, navigation, and timing.',
  inputSchema: { specPath: z.string().min(1) },
}, async ({ specPath }) => response(await recordFromSpecFile(specPath)));

server.registerTool('list_music', {
  title: 'List Open Music',
  description: 'Explicitly browse the bundled CC0 instrumental tracks by mood and intensity. These are optional candidates, not defaults or recommendations.',
  inputSchema: {
    mood: z.string().optional(),
    maxIntensity: z.number().min(0).max(1).optional(),
  },
}, async ({ mood, maxIntensity }) => response(await listAudioTracks({ mood, maxIntensity })));

server.registerTool('generate_music_library', {
  title: 'Generate Open Music Library',
  description: 'Generate the bundled deterministic CC0 music WAV files locally. No model or paid API is used.',
  inputSchema: {},
}, async () => response({ generated: await generateAudioLibrary() }));

server.registerTool('search_music', {
  title: 'Search Free Music',
  description: 'Search licensed music across Freesound first, then user-approved local folders, Jamendo, and Wikimedia Audio through the Openverse catalog. Bundled tracks are excluded unless explicitly requested; every result retains its source and license metadata.',
  inputSchema: {
    query: z.string().optional(),
    provider: z.enum(['all', 'local', 'bundled', 'freesound', 'jamendo', 'wikimedia_audio', 'openverse']).default('all'),
    localDirectories: z.array(z.string()).optional(),
    includeBundled: z.boolean().default(false),
    source: z.string().optional(),
    minDuration: z.number().nonnegative().optional(),
    maxDuration: z.number().positive().optional(),
    allowUnknownLocalLicense: z.boolean().default(false),
  },
}, async (options) => response(await searchMusic(options)));

server.registerTool('download_music', {
  title: 'Download Licensed Music',
  description: 'Download a selected Openverse track locally and write machine-readable license and attribution manifests.',
  inputSchema: {
    openverseId: z.string().uuid(),
    outputDir: z.string().min(1),
  },
}, async ({ openverseId, outputDir }) => response(await downloadOpenverseMusic(openverseId, outputDir)));

server.registerTool('analyze_music', {
  title: 'Analyze Music Candidate',
  description: 'Measure one local candidate\'s duration, loudness, energy curve, peak-energy times, and silence; optionally generate waveform and spectrogram images for comparison. This does not recommend or select a track.',
  inputSchema: {
    path: z.string().min(1),
    reviewDir: z.string().optional(),
  },
}, async ({ path, reviewDir }) => response(await analyzeMusic(path, reviewDir)));

server.registerTool('search_free_videos', {
  title: 'Search Free Video Footage',
  description: 'Search user-approved local folders plus optional free-key Pexels and Pixabay footage, then keyless Wikimedia Commons. Returns dimensions, duration, previews, source pages, and license obligations; no paid media provider is used.',
  inputSchema: {
    query: z.string().optional(),
    provider: z.enum(['all', 'local', 'pexels', 'pixabay', 'wikimedia']).default('all'),
    localDirectories: z.array(z.string()).optional(),
    orientation: z.enum(['landscape', 'portrait', 'square']).optional(),
    minDuration: z.number().nonnegative().optional(),
    maxDuration: z.number().positive().optional(),
    minWidth: z.number().int().positive().optional(),
    minHeight: z.number().int().positive().optional(),
    pageSize: z.number().int().min(1).max(50).default(12),
    pexelsLocale: z.string().optional(),
    pixabayLocale: z.string().optional(),
    includeShareAlike: z.boolean().default(false),
    allowUnknownLocalLicense: z.boolean().default(false),
  },
}, async (options) => response(await searchFreeVideos(options)));

server.registerTool('download_free_video', {
  title: 'Download Free Video Footage',
  description: 'Download a selected Wikimedia Commons, Pexels, or Pixabay video and write a sidecar plus credits.json with its source, license, attribution, and share-alike obligations. Pexels and Pixabay use free API keys.',
  inputSchema: {
    provider: z.enum(['wikimedia', 'pexels', 'pixabay']),
    id: z.string().regex(/^\d+$/),
    outputDir: z.string().min(1),
    includeShareAlike: z.boolean().default(false),
  },
}, async ({ provider, id, outputDir, includeShareAlike }) => response(await downloadFreeVideo(provider, id, outputDir, { includeShareAlike })));

server.registerTool('search_free_assets', {
  title: 'Search Free Visual Assets',
  description: 'Search user-approved local folders, optional free-key Pexels and Pixabay photos, Openverse, and Wikimedia Commons for free images, SVGs, and animated GIF assets. Returns previews, dimensions, direct downloads, source pages, and machine-readable license obligations.',
  inputSchema: {
    query: z.string().optional(),
    provider: z.enum(['all', 'local', 'pexels', 'pixabay', 'openverse', 'wikimedia']).default('all'),
    localDirectories: z.array(z.string()).optional(),
    kind: z.enum(['all', 'image', 'svg', 'animation']).default('all'),
    orientation: z.enum(['landscape', 'portrait', 'square']).optional(),
    minWidth: z.number().int().positive().optional(),
    minHeight: z.number().int().positive().optional(),
    pageSize: z.number().int().min(1).max(50).default(12),
    openverseSource: z.string().optional(),
    pexelsLocale: z.string().optional(),
    pixabayLocale: z.string().optional(),
    includeShareAlike: z.boolean().default(false),
    allowUnknownLocalLicense: z.boolean().default(false),
  },
}, async (options) => response(await searchFreeAssets(options)));

server.registerTool('download_free_asset', {
  title: 'Download Free Visual Asset',
  description: 'Download a selected Openverse, Wikimedia Commons, Pexels, or Pixabay image/SVG/animation and write a sidecar plus credits.json with its source and license obligations.',
  inputSchema: {
    provider: z.enum(['openverse', 'wikimedia', 'pexels', 'pixabay']),
    id: z.string().min(1),
    outputDir: z.string().min(1),
    includeShareAlike: z.boolean().default(false),
  },
}, async ({ provider, id, outputDir, includeShareAlike }) => response(await downloadFreeAsset(provider, id, outputDir, { includeShareAlike })));

server.registerTool('mix_music', {
  title: 'Mix Music With Timeline Automation',
  description: 'Add or replace a final video music track with an AI-authored, frame-evaluated volume envelope for cues, drops, ducks, and fades. Video is stream-copied without rerendering.',
  inputSchema: {
    inputVideo: z.string().min(1),
    music: z.string().min(1),
    output: z.string().regex(/\.mp4$/i),
    baseVolume: z.number().min(0).max(4).default(0.25),
    sourceOffset: z.number().nonnegative().default(0),
    loop: z.boolean().default(true),
    preserveOriginalAudio: z.boolean().default(false),
    originalVolume: z.number().min(0).max(4).default(1),
    envelope: z.array(z.object({ time: z.number().nonnegative(), volume: z.number().min(0).max(4) })).min(1).max(100).default([{ time: 0, volume: 1 }]),
  },
}, async (options) => response(await mixMusic(options)));

server.registerTool('validate_video_plan', {
  title: 'Validate Legacy JSON Video Plan',
  description: 'Validate an existing v1 fixed-layout JSON plan for compatibility. Do not use this format as a draft or template for a new production.',
  inputSchema: { specPath: z.string().min(1) },
}, async ({ specPath }) => response(await validateSpec(specPath, 'video')));

server.registerTool('render_video', {
  title: 'Render Legacy JSON Video',
  description: 'Compatibility renderer for an existing v1 fixed-layout JSON video. New productions must be authored directly as Revideo compositions and must not render this first as a disposable template.',
  inputSchema: {
    specPath: z.string().min(1),
    workers: z.number().int().min(1).max(12).optional(),
    keepFrames: z.boolean().optional(),
  },
}, async ({ specPath, workers, keepFrames }) => response(await renderFromSpecFile(specPath, { workers, keepFrames })));

server.registerTool('probe_video', {
  title: 'Probe Rendered Video',
  description: 'Read duration, dimensions, frame rate, codecs, file size, and audio presence from a rendered video.',
  inputSchema: { videoPath: z.string().min(1) },
}, async ({ videoPath }) => response(await probeVideo(videoPath)));

server.registerTool('extract_review_frames', {
  title: 'Extract Review Frames',
  description: 'Extract still frames at chosen timestamps so the AI can visually review composition and motion states.',
  inputSchema: {
    videoPath: z.string().min(1),
    outputDir: z.string().min(1),
    times: z.array(z.number().nonnegative()).min(1).max(20),
  },
}, async ({ videoPath, outputDir, times }) => response({ frames: await extractReviewFrames(videoPath, outputDir, times) }));

server.registerTool('create_visual_review_pack', {
  title: 'Create Mandatory Visual Review Pack',
  description: 'Create overview sheets, exact declared settle frames, transition strips, source/motion lint, focal-motion continuity candidates, and—when projectFile is supplied—an isolated layout-audit render with exact annotated screenshots for registered overflow, collision, and centering candidates. The host AI must classify every candidate as intentional or material before delivery.',
  inputSchema: {
    videoPath: z.string().min(1),
    outputDir: z.string().min(1),
    overviewInterval: z.number().min(0.25).max(10).default(2),
    transitionTimes: z.array(z.number().nonnegative()).max(30).default([]),
    transitionWindow: z.number().min(0.25).max(3).default(1),
    transitionFps: z.number().min(1).max(12).default(4),
    projectFile: z.string().min(1).optional(),
    motionPlanPath: z.string().min(1).optional(),
    reviewRenderVariables: z.record(z.string(), z.unknown()).optional(),
    layoutAuditFps: z.number().min(2).max(12).default(6),
    maxLayoutEvidence: z.number().int().min(1).max(30).default(12),
  },
}, async ({ videoPath, outputDir, ...options }) => response(await createVisualReviewPack(videoPath, outputDir, options)));

const visualMimeTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

server.registerTool('read_visual_files', {
  title: 'Read Review Sheets and Visual Assets',
  description: 'Return local review sheets, captures, downloaded assets, or other images directly as MCP image content so a vision-capable host AI can inspect them without a separate filesystem tool.',
  inputSchema: {
    paths: z.array(z.string().min(1)).min(1).max(12),
  },
}, async ({ paths }) => {
  const content: ContentBlock[] = [];
  let totalBytes = 0;
  for (const path of paths) {
    const absolutePath = resolve(path);
    const mimeType = visualMimeTypes[extname(absolutePath).toLowerCase()];
    if (!mimeType) throw new Error(`Unsupported visual file type: ${extname(absolutePath) || '(none)'}`);
    const details = await stat(absolutePath);
    if (!details.isFile()) throw new Error(`Visual path is not a file: ${absolutePath}`);
    if (details.size > 15 * 1024 * 1024) throw new Error(`Visual file exceeds the 15 MB safety limit: ${absolutePath}`);
    totalBytes += details.size;
    if (totalBytes > 40 * 1024 * 1024) throw new Error('Combined visual payload exceeds the 40 MB safety limit');
    content.push({ type: 'text', text: absolutePath });
    content.push({ type: 'image', data: (await readFile(absolutePath)).toString('base64'), mimeType });
  }
  return { content };
});

server.registerTool('list_motion_capabilities', {
  title: 'List Motion Composition Capabilities',
  description: 'List the open-source Revideo primitives, effects, component-library scope, 3D features, and custom TypeScript escape hatches available in every new production.',
  inputSchema: {},
}, async () => response(motionCapabilities));

server.registerTool('list_format_profiles', {
  title: 'List Video Format Profiles',
  description: 'List landscape, portrait, and square composition profiles plus conservative platform safe-area defaults for generic delivery, TikTok, Instagram Reels, and YouTube Shorts.',
  inputSchema: {
    format: z.enum(videoFormatIds).optional(),
    platform: z.enum(platformTargets).optional(),
  },
}, async ({ format, platform }) => response(format || platform
  ? resolveVideoFormat({ format, platform })
  : { formats: videoFormatProfiles, platforms: platformTargets, note: 'Safe areas are editable authoring defaults; verify the current publishing UI before delivery.' }));

server.registerTool('prepare_caption_timing', {
  title: 'Prepare Kinetic Caption Timing',
  description: 'Parse SRT, WebVTT, cue JSON, or exact word-timing JSON into deterministic caption-timing JSON. Cue-only sources receive explicitly labeled approximate per-word interpolation and timing QA.',
  inputSchema: {
    inputPath: z.string().min(1),
    outputPath: z.string().optional(),
  },
}, async (options) => response(await prepareCaptionTiming(options)));

server.registerTool('review_caption_timing', {
  title: 'Review Caption Timing',
  description: 'Review normalized caption timing for invalid ranges, overlaps, excessive reading speed, long phrases, dense words, and approximate alignment before animation.',
  inputSchema: { captionTimingPath: z.string().min(1) },
}, async ({ captionTimingPath }) => response(await reviewCaptionTiming(captionTimingPath)));

server.registerTool('search_motion_components', {
  title: 'Search Motion Components',
  description: 'Search the reusable motion vocabulary by narrative need, category, mood, tags, or energy. Results are building blocks and recipes, never a default template or required visual style.',
  inputSchema: {
    query: z.string().optional(),
    categories: z.array(z.enum(motionComponentCategories)).max(motionComponentCategories.length).optional(),
    tags: z.array(z.string().min(1)).max(12).optional(),
    moods: z.array(z.string().min(1)).max(12).optional(),
    energy: z.array(z.enum(['quiet', 'measured', 'energetic', 'impact'])).max(4).optional(),
    limit: z.number().int().min(1).max(100).default(12),
  },
}, async (options) => {
  const components = searchMotionComponents(options);
  return response({ intent: 'possibilities, not recommendations', count: components.length, components });
});

server.registerTool('get_motion_component', {
  title: 'Get Motion Component',
  description: 'Get full composition notes, source exports, and parameters for one component before combining or customizing it in a Revideo scene.',
  inputSchema: { id: z.string().min(1) },
}, async ({ id }) => {
  const found = motionComponentLibrary.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown motion component: ${id}`);
  return response({
    ...found,
    detailedHelp: {
      tool: 'help',
      arguments: { target: `${found.category === 'transition' ? 'transition' : 'component'}:${found.id}` },
      note: 'Call contextual help before authoring this component when parameter values, constraints, choreography, pitfalls, or validation are uncertain. Every source export is optional editable source: customize, combine, replace, or ignore it and author a completely original compatible implementation whenever that serves the shot better.',
    },
  });
});

server.registerTool('scaffold_advanced_video', {
  title: 'Scaffold Revideo Composition',
  description: 'Create the minimal neutral code-first project used for every new production: project, blank scene, review registry, format profile, and motion plan. It adds no optional helper library, empty public folder, predesigned scene, palette, cards, copy, or music choice.',
  inputSchema: {
    outputDir: z.string().min(1),
    name: z.string().min(1),
    format: z.enum(videoFormatIds).optional(),
    platform: z.enum(platformTargets).optional(),
    width: z.number().int().min(640).max(3840).optional(),
    height: z.number().int().min(360).max(3840).optional(),
    fps: z.number().int().min(24).max(60).default(30),
  },
}, async (options) => response(await scaffoldAdvancedProject(options)));

server.registerTool('add_advanced_video_helpers', {
  title: 'Add Advanced Video Source Helpers',
  description: 'Copy only the optional editable source helpers selected for this production, plus their required helper dependencies. Existing project files are never overwritten.',
  inputSchema: {
    projectDir: z.string().min(1),
    helpers: z.array(z.enum(advancedVideoHelperIds)).min(1).max(advancedVideoHelperIds.length),
  },
}, async ({ projectDir, helpers }) => response(await addAdvancedVideoHelpers(projectDir, helpers)));

server.registerTool('validate_motion_plan', {
  title: 'Validate Motion Plan',
  description: 'Validate motion-plan.json before the first render. Returns exact schema paths, semantic timeline errors, undeclared shot boundaries, unexplained gaps, settle warnings, and the compact authoring contract needed to repair the file.',
  inputSchema: {
    motionPlanPath: z.string().min(1),
  },
}, async ({ motionPlanPath }) => response(await validateMotionPlan(motionPlanPath)));

server.registerTool('list_advanced_video_files', {
  title: 'List Advanced Video Source Files',
  description: 'List editable TypeScript, CSS, JSON, and SVG files in an advanced video project before reading or patching it.',
  inputSchema: { projectDir: z.string().min(1) },
}, async ({ projectDir }) => response(await listAdvancedProjectFiles(projectDir)));

server.registerTool('read_advanced_video_file', {
  title: 'Read Advanced Video Source',
  description: 'Read an existing advanced video source file so an MCP-only AI can understand and revise it without separate filesystem access.',
  inputSchema: {
    projectDir: z.string().min(1),
    relativePath: z.string().min(1),
  },
}, async ({ projectDir, relativePath }) => response(await readAdvancedProjectFile(projectDir, relativePath)));

server.registerTool('save_advanced_video_file', {
  title: 'Save Advanced Video Source',
  description: 'Save AI-authored TypeScript, CSS, JSON, or SVG source inside a scaffolded advanced video project.',
  inputSchema: {
    projectDir: z.string().min(1),
    relativePath: z.string().min(1),
    source: z.string(),
  },
}, async ({ projectDir, relativePath, source }) => response({ path: await saveAdvancedProjectFile(projectDir, relativePath, source) }));

server.registerTool('patch_advanced_video_file', {
  title: 'Patch Advanced Video Source',
  description: 'Surgically change exact portions of an existing advanced video project without recreating its source.',
  inputSchema: {
    projectDir: z.string().min(1),
    relativePath: z.string().min(1),
    patches: z.array(z.object({ find: z.string().min(1), replace: z.string() })).min(1).max(50),
  },
}, async ({ projectDir, relativePath, patches }) => response(await patchAdvancedProjectFile(projectDir, relativePath, patches)));

server.registerTool('render_advanced_video', {
  title: 'Render Revideo Composition',
  description: 'Headlessly render the library-first and custom TypeScript composition in an isolated process group. Before Chromium starts, preflight rejects an invalid motion plan, undeclared shot boundaries, syntax errors, invalid names, broken imports, missing exports, and unsafe Revideo scene-tree collections. Failures return structured diagnostics. Includes live progress, cancellation, timeout protection, and automatic Chromium/Vite cleanup. Optionally renders only a changed time range. Telemetry is disabled.',
  inputSchema: {
    projectFile: z.string().min(1),
    output: z.string().regex(/\.mp4$/),
    variables: z.record(z.string(), z.unknown()).optional(),
    workers: z.number().int().min(1).max(8).default(1),
    width: z.number().int().min(640).max(3840).optional(),
    height: z.number().int().min(360).max(2160).optional(),
    rangeStart: z.number().nonnegative().optional(),
    rangeEnd: z.number().positive().optional(),
    startupTimeoutSeconds: z.number().int().min(10).max(900).default(120),
    stallTimeoutSeconds: z.number().int().min(10).max(3600).default(300),
    maxRenderSeconds: z.number().int().min(30).max(86400).default(7200),
  },
}, async ({ startupTimeoutSeconds, stallTimeoutSeconds, maxRenderSeconds, ...options }, extra) => {
  let notifications = Promise.resolve();
  const publishProgress = (update: Parameters<NonNullable<Parameters<typeof renderAdvancedProject>[0]['onProgress']>>[0]): void => {
    notifications = notifications.then(async () => {
      const progressToken = extra._meta?.progressToken;
      if (progressToken !== undefined) {
        await extra.sendNotification({
          method: 'notifications/progress',
          params: {
            progressToken,
            progress: Math.round(update.progress * 100),
            total: 100,
            message: update.message,
          },
        }).catch(() => undefined);
      }
      await server.sendLoggingMessage({
        level: 'info',
        logger: 'ai-promo-video.render',
        data: {
          phase: update.phase,
          percent: Math.round(update.progress * 100),
          message: update.message,
          ...(update.worker === undefined ? {} : { worker: update.worker }),
          ...(update.workers === undefined ? {} : { workers: update.workers }),
        },
      }, extra.sessionId).catch(() => undefined);
    });
  };
  try {
    const result = await renderAdvancedProject({
      ...options,
      signal: extra.signal,
      startupTimeoutMs: startupTimeoutSeconds * 1000,
      stallTimeoutMs: stallTimeoutSeconds * 1000,
      maxRenderTimeMs: maxRenderSeconds * 1000,
      onProgress: publishProgress,
    });
    await notifications;
    return response(result);
  } catch (error) {
    await notifications;
    const report = serializeAdvancedError(error);
    await server.sendLoggingMessage({
      level: 'error',
      logger: 'ai-promo-video.render',
      data: report,
    }, extra.sessionId).catch(() => undefined);
    return errorResponse(error);
  }
});

const cropSchema = z.object({ x: z.number().int().nonnegative(), y: z.number().int().nonnegative(), width: z.number().int().positive(), height: z.number().int().positive() });
const resizeSchema = z.object({ width: z.number().int().positive(), height: z.number().int().positive(), fit: z.enum(['contain', 'cover', 'stretch']).default('contain'), background: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#000000') });
const colorSchema = z.object({ brightness: z.number().min(-1).max(1).default(0), contrast: z.number().min(0).max(3).default(1), saturation: z.number().min(0).max(3).default(1), gamma: z.number().min(0.1).max(10).default(1) });
const removeColorSchema = z.object({ color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'), similarity: z.number().min(0.01).max(1).default(0.12), blend: z.number().min(0).max(1).default(0.04) });

server.registerTool('edit_capture_image', {
  title: 'Edit Capture Image',
  description: 'Create a derived capture image with non-destructive crop, resize, color correction, and blur/redaction; the original stays untouched.',
  inputSchema: {
    input: z.string().min(1), output: z.string().min(1), crop: cropSchema.optional(), resize: resizeSchema.optional(), color: colorSchema.optional(), blur: z.number().min(0).max(100).optional(), removeColor: removeColorSchema.optional(),
  },
}, async (options) => response(await editImage(options)));

server.registerTool('edit_video', {
  title: 'Edit Video',
  description: 'Create a revised MP4 from a capture or final render using trim, speed, crop, resize, color, blur, fades, volume, or mute without changing the original.',
  inputSchema: {
    input: z.string().min(1), output: z.string().regex(/\.mp4$/i), start: z.number().nonnegative().optional(), end: z.number().positive().optional(), speed: z.number().min(0.25).max(4).default(1), crop: cropSchema.optional(), resize: resizeSchema.optional(), color: colorSchema.optional(), blur: z.number().min(0).max(100).optional(), fadeIn: z.number().min(0).max(10).default(0), fadeOut: z.number().min(0).max(10).default(0), volume: z.number().min(0).max(4).default(1), mute: z.boolean().default(false),
  },
}, async (options) => response(await editVideo(options)));

server.registerTool('replace_video_range', {
  title: 'Replace Final Video Range',
  description: 'Replace one exact interval in an existing final MP4 with a newly rendered interval, preserving the rest of the video and its timeline.',
  inputSchema: {
    original: z.string().min(1), replacement: z.string().min(1), output: z.string().regex(/\.mp4$/i), start: z.number().nonnegative(), end: z.number().positive(),
  },
}, async (options) => response(await replaceVideoRange(options)));

server.registerTool('clean_delivery_output', {
  title: 'Clean Final Delivery Output',
  description: 'Verify every named final deliverable and recursively clean generated project artifacts even when the output directory is outside the project. External outputs default to shared mode, which never removes sibling files. Owned mode reduces a dedicated delivery directory to keepFiles. Editable source and required render inputs remain protected.',
  inputSchema: {
    outputDir: z.string().min(1),
    keepFiles: z.array(z.string().min(1)).min(1).max(20),
    projectDir: z.string().min(1).optional(),
    temporaryPaths: z.array(z.string().min(1)).max(200).optional(),
    outputMode: z.enum(['owned', 'shared']).optional(),
  },
}, async ({ outputDir, keepFiles, projectDir, temporaryPaths, outputMode }) => response(await cleanDeliveryOutput(
  outputDir,
  keepFiles,
  {projectDir, temporaryPaths, outputMode},
)));

const transport = new StdioServerTransport();
await server.connect(transport);
