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
import { downloadOpenverseMusic, searchOpenverseMusic } from '../audio/openverse.js';
import { searchLocalMusic } from '../audio/search.js';
import { captureFromSpecFile, inspectSite, recordFromSpecFile } from '../capture/capture.js';
import { createVisualReviewPack, extractReviewFrames, probeVideo } from '../render/probe.js';
import { renderFromSpecFile } from '../render/renderer.js';
import { validateSpec } from '../commands.js';
import { listAdvancedProjectFiles, motionCapabilities, patchAdvancedProjectFile, readAdvancedProjectFile, renderAdvancedProject, saveAdvancedProjectFile, scaffoldAdvancedProject } from '../advanced/engine.js';
import { editImage, editVideo, mixMusic, replaceVideoRange } from '../media/edit.js';
import { cleanDeliveryOutput } from '../media/cleanup.js';
import { downloadFreeAsset, downloadFreeVideo, searchFreeAssets, searchFreeVideos } from '../library/search.js';

const skillDirectory = fileURLToPath(new URL('../../skills/create-ai-promo-video/', import.meta.url));
const directorGuide = await readFile(join(skillDirectory, 'SKILL.md'), 'utf8');
const referenceNames = [
  'advanced-motion',
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
  version: '0.1.0',
}, {
  instructions: 'Create professional, custom motion-design films rather than raw screen recordings or slide decks. For cinematic or After Effects-like work, use the advanced Revideo tools. Before delivery: preserve license metadata, call create_visual_review_pack, inspect every generated sheet with read_visual_files, correct material anomalies, probe again, and use clean_delivery_output so only requested deliverables remain. Read ai-promo://director-guide or invoke the create-ai-promo-video prompt for the complete workflow.',
});

function response(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

server.registerResource('ai-promo-director-guide', 'ai-promo://director-guide', {
  title: 'AI Promo Video Director Guide',
  description: 'Complete professional directing workflow shared by Codex, Claude, Cursor, and other MCP clients.',
  mimeType: 'text/markdown',
}, async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: directorGuide }] }));

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
  description: 'List bundled, attribution-free CC0 instrumental tracks by mood and intensity.',
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
  description: 'Search bundled/local files and Openverse for music with commercial-friendly CC0, public-domain, or CC BY licenses.',
  inputSchema: {
    query: z.string().optional(),
    provider: z.enum(['all', 'local', 'openverse']).default('all'),
    localDirectories: z.array(z.string()).optional(),
    source: z.string().optional(),
    minDuration: z.number().nonnegative().optional(),
    maxDuration: z.number().positive().optional(),
    allowUnknownLocalLicense: z.boolean().default(false),
  },
}, async ({ query, provider, localDirectories, source, minDuration, maxDuration, allowUnknownLocalLicense }) => {
  const results = [];
  if (provider === 'all' || provider === 'local') results.push(...await searchLocalMusic({ query, directories: localDirectories, minDuration, maxDuration, allowUnknownLicense: allowUnknownLocalLicense }));
  if (provider === 'all' || provider === 'openverse') {
    if (!query) throw new Error('Openverse search requires a query');
    results.push(...await searchOpenverseMusic({ query, source, minDuration, maxDuration }));
  }
  return response(results);
});

server.registerTool('download_music', {
  title: 'Download Licensed Music',
  description: 'Download a selected Openverse track locally and write machine-readable license and attribution manifests.',
  inputSchema: {
    openverseId: z.string().uuid(),
    outputDir: z.string().min(1),
  },
}, async ({ openverseId, outputDir }) => response(await downloadOpenverseMusic(openverseId, outputDir)));

server.registerTool('search_free_videos', {
  title: 'Search Free Video Footage',
  description: 'Search user-approved local folders, keyless Wikimedia Commons, and optional free-key Pexels stock footage. Returns dimensions, duration, previews, source pages, and license obligations; no paid media provider is used.',
  inputSchema: {
    query: z.string().optional(),
    provider: z.enum(['all', 'local', 'wikimedia', 'pexels']).default('all'),
    localDirectories: z.array(z.string()).optional(),
    orientation: z.enum(['landscape', 'portrait', 'square']).optional(),
    minDuration: z.number().nonnegative().optional(),
    maxDuration: z.number().positive().optional(),
    minWidth: z.number().int().positive().optional(),
    minHeight: z.number().int().positive().optional(),
    pageSize: z.number().int().min(1).max(50).default(12),
    pexelsLocale: z.string().optional(),
    includeShareAlike: z.boolean().default(false),
    allowUnknownLocalLicense: z.boolean().default(false),
  },
}, async (options) => response(await searchFreeVideos(options)));

server.registerTool('download_free_video', {
  title: 'Download Free Video Footage',
  description: 'Download a selected Wikimedia Commons or Pexels video and write a sidecar plus credits.json with its source, license, attribution, and share-alike obligations. Pexels uses the free PEXELS_API_KEY environment variable.',
  inputSchema: {
    provider: z.enum(['wikimedia', 'pexels']),
    id: z.string().regex(/^\d+$/),
    outputDir: z.string().min(1),
    includeShareAlike: z.boolean().default(false),
  },
}, async ({ provider, id, outputDir, includeShareAlike }) => response(await downloadFreeVideo(provider, id, outputDir, { includeShareAlike })));

server.registerTool('search_free_assets', {
  title: 'Search Free Visual Assets',
  description: 'Search user-approved local folders, Openverse, Wikimedia Commons, and optional free-key Pexels photos for free images, SVGs, and animated GIF assets. Returns previews, dimensions, direct downloads, source pages, and machine-readable license obligations.',
  inputSchema: {
    query: z.string().optional(),
    provider: z.enum(['all', 'local', 'openverse', 'wikimedia', 'pexels']).default('all'),
    localDirectories: z.array(z.string()).optional(),
    kind: z.enum(['all', 'image', 'svg', 'animation']).default('all'),
    orientation: z.enum(['landscape', 'portrait', 'square']).optional(),
    minWidth: z.number().int().positive().optional(),
    minHeight: z.number().int().positive().optional(),
    pageSize: z.number().int().min(1).max(50).default(12),
    openverseSource: z.string().optional(),
    pexelsLocale: z.string().optional(),
    includeShareAlike: z.boolean().default(false),
    allowUnknownLocalLicense: z.boolean().default(false),
  },
}, async (options) => response(await searchFreeAssets(options)));

server.registerTool('download_free_asset', {
  title: 'Download Free Visual Asset',
  description: 'Download a selected Openverse, Wikimedia Commons, or Pexels image/SVG/animation and write a sidecar plus credits.json with its source and license obligations.',
  inputSchema: {
    provider: z.enum(['openverse', 'wikimedia', 'pexels']),
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
  title: 'Validate Video Plan',
  description: 'Validate a video JSON plan, including exact scene timing and supported motion primitives.',
  inputSchema: { specPath: z.string().min(1) },
}, async ({ specPath }) => response(await validateSpec(specPath, 'video')));

server.registerTool('render_video', {
  title: 'Render Promo Video',
  description: 'Render a professional deterministic MP4 from a validated JSON video plan with Chromium and FFmpeg.',
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
  description: 'Create dense overview sheets, frame strips around every declared transition, technical anomaly candidates, and a visual checklist. The host AI must view every generated sheet after a full render or changed range before delivery.',
  inputSchema: {
    videoPath: z.string().min(1),
    outputDir: z.string().min(1),
    overviewInterval: z.number().min(0.25).max(10).default(2),
    transitionTimes: z.array(z.number().nonnegative()).max(30).default([]),
    transitionWindow: z.number().min(0.25).max(3).default(1),
    transitionFps: z.number().min(1).max(12).default(4),
  },
}, async ({ videoPath, outputDir, overviewInterval, transitionTimes, transitionWindow, transitionFps }) => response(await createVisualReviewPack(videoPath, outputDir, { overviewInterval, transitionTimes, transitionWindow, transitionFps })));

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
  title: 'List Advanced Motion Capabilities',
  description: 'List the open-source Revideo motion primitives, effects, 3D features, and SaaS animation patterns available to the AI.',
  inputSchema: {},
}, async () => response(motionCapabilities));

server.registerTool('scaffold_advanced_video', {
  title: 'Scaffold Advanced Video',
  description: 'Create a code-first Revideo project that the host AI can make completely unique with shapes, UI assembly, cursor motion, SVG, media, and 3D.',
  inputSchema: {
    outputDir: z.string().min(1),
    name: z.string().min(1),
    width: z.number().int().min(640).max(3840).default(1920),
    height: z.number().int().min(360).max(2160).default(1080),
    fps: z.number().int().min(24).max(60).default(30),
  },
}, async (options) => response(await scaffoldAdvancedProject(options)));

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
  title: 'Render Advanced Video',
  description: 'Headlessly render a completely custom Revideo TypeScript project, optionally rendering only a changed time range. Telemetry is disabled.',
  inputSchema: {
    projectFile: z.string().min(1),
    output: z.string().regex(/\.mp4$/),
    variables: z.record(z.string(), z.unknown()).optional(),
    workers: z.number().int().min(1).max(8).default(1),
    width: z.number().int().min(640).max(3840).optional(),
    height: z.number().int().min(360).max(2160).optional(),
    rangeStart: z.number().nonnegative().optional(),
    rangeEnd: z.number().positive().optional(),
  },
}, async (options) => response(await renderAdvancedProject(options)));

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
  description: 'Safely remove renderer fragments, previews, obsolete finals, and temporary review packs from one delivery directory after verifying that every named final deliverable exists. Source media and files outside the delivery directory are untouched.',
  inputSchema: {
    outputDir: z.string().min(1),
    keepFiles: z.array(z.string().min(1)).min(1).max(20),
  },
}, async ({ outputDir, keepFiles }) => response(await cleanDeliveryOutput(outputDir, keepFiles)));

const transport = new StdioServerTransport();
await server.connect(transport);
