import { motionComponentCategories, motionComponentLibrary, type MotionComponent } from '../advanced/library.js';

export const helpKinds = ['tool', 'component', 'transition', 'topic'] as const;
export type HelpKind = typeof helpKinds[number];

export interface HelpParameter {
  type: string;
  required?: boolean;
  default?: unknown;
  accepted?: string;
  recommended?: string;
  description: string;
  constraints?: string[];
}

export interface HelpEntry {
  kind: HelpKind;
  id: string;
  title: string;
  summary: string;
  whenToUse?: string[];
  avoidWhen?: string[];
  prerequisites?: string[];
  parameters?: Record<string, HelpParameter>;
  workflow?: string[];
  example?: string;
  pitfalls?: string[];
  validation?: string[];
  related?: string[];
  sourceExports?: string[];
  tags?: string[];
  moods?: string[];
  energy?: string[];
  notes?: string;
  contractLevel?: 'catalog' | 'calibrated';
}

const parameter = (
  type: string,
  description: string,
  options: Omit<HelpParameter, 'type' | 'description'> = {},
): HelpParameter => ({type, description, ...options});

const tool = (
  id: string,
  title: string,
  summary: string,
  parameters: Record<string, HelpParameter> = {},
  details: Omit<HelpEntry, 'kind' | 'id' | 'title' | 'summary' | 'parameters'> = {},
): HelpEntry => ({kind: 'tool', id, title, summary, parameters, ...details});

/**
 * Detailed operational notes live here instead of in the MCP server instructions.
 * The host only loads one selected entry through the help tool.
 */
export const toolHelpEntries: HelpEntry[] = [
  tool('help', 'Contextual Help', 'Load detailed documentation for one exact MCP tool, motion component, transition, or production topic without loading the entire manual.', {
    target: parameter('string', 'Compact target in kind:id form, for example component:liquid-glass-text or tool:render_advanced_video.'),
    kind: parameter("'tool' | 'component' | 'transition' | 'topic'", 'Optional target kind when id is supplied separately.'),
    id: parameter('string', 'Exact id inside the selected kind.'),
    query: parameter('string', 'Free-text search terms for compact candidates. A value already shaped as kind:id is automatically promoted to an exact target lookup.'),
    limit: parameter('integer', 'Maximum search candidates.', {default: 12, accepted: '1..30'}),
  }, {
    workflow: ['Call with no arguments for a compact index.', 'Search when the exact id is unknown.', 'Call again with an exact target before using a fragile or unfamiliar feature.'],
    pitfalls: ['Do not call help for every familiar operation.', 'Search results are summaries; an exact target returns the full contract.'],
    related: ['topic:help-workflow'],
  }),
  tool('load_director_guide', 'Load Director Guide', 'Load the complete production workflow when the MCP client did not discover the filesystem Skill.', {}, {
    whenToUse: ['Claude Desktop Home or another MCP-only host has no create-ai-promo-video Skill.'],
    avoidWhen: ['The filesystem Skill is already active; use contextual help for isolated questions instead.'],
  }),
  tool('inspect_saas', 'Inspect SaaS', 'Inspect a public SaaS page for messaging, headings, colors, and an optional screenshot.', {
    url: parameter('URL string', 'Public page to inspect.', {required: true}),
    screenshotPath: parameter('path string', 'Optional local PNG/JPEG output path.'),
  }),
  tool('capture_saas', 'Capture SaaS Screens', 'Run a capture spec and save clean application screenshots or recording assets.', {
    specPath: parameter('path string', 'Capture JSON spec. Keep credentials in a gitignored *.local.json file.', {required: true}),
  }, {prerequisites: ['Install Chromium with the browser installer when it is not available.'], related: ['topic:capture']}),
  tool('record_saas_flows', 'Record SaaS Flows', 'Record authored application interactions as clean MP4 source clips.', {
    specPath: parameter('path string', 'Recording-capable capture JSON spec.', {required: true}),
  }, {pitfalls: ['Hide the browser pointer when a designed cursor will be composited later.', 'Record proof-bearing actions, not long raw navigation.'], related: ['topic:capture']}),
  tool('list_music', 'List Bundled Open Music', 'Explicitly browse bundled CC0 candidates; no item is a default.', {
    mood: parameter('string', 'Optional mood filter.'),
    maxIntensity: parameter('number', 'Maximum normalized intensity.', {accepted: '0..1'}),
  }, {avoidWhen: ['The user did not explicitly ask to include bundled tracks.']}),
  tool('generate_music_library', 'Generate Open Music Library', 'Generate deterministic bundled CC0 WAV files locally.', {}),
  tool('search_music', 'Search Free Music', 'Search licensed local folders and Openverse by explicit musical intent.', {
    query: parameter('string', 'Search phrase describing emotion, energy, instrumentation, and exclusions.'),
    provider: parameter("'all' | 'local' | 'bundled' | 'openverse'", 'Search surface.', {default: 'all'}),
    localDirectories: parameter('string[]', 'User-approved local folders.'),
    includeBundled: parameter('boolean', 'Include bundled candidates in all/local search.', {default: false}),
    source: parameter('string', 'Optional Openverse source filter.'),
    minDuration: parameter('number', 'Minimum seconds.', {accepted: '>= 0'}),
    maxDuration: parameter('number', 'Maximum seconds.', {accepted: '> 0'}),
    allowUnknownLocalLicense: parameter('boolean', 'Expose unknown-license local files as candidates.', {default: false}),
  }, {workflow: ['Write musical intent first.', 'Compare at least three viable candidates when available.', 'Analyze finalists and preserve license metadata.'], related: ['tool:analyze_music', 'tool:download_music', 'tool:mix_music']}),
  tool('download_music', 'Download Licensed Music', 'Download one selected Openverse track with license and attribution manifests.', {
    openverseId: parameter('UUID string', 'Exact selected Openverse id.', {required: true}),
    outputDir: parameter('path string', 'Destination outside the final delivery-only directory.', {required: true}),
  }),
  tool('analyze_music', 'Analyze Music Candidate', 'Measure duration, loudness, energy, peaks, and silence without recommending a track.', {
    path: parameter('path string', 'Local audio candidate.', {required: true}),
    reviewDir: parameter('path string', 'Optional waveform and spectrogram directory.'),
  }),
  tool('search_free_videos', 'Search Free Video Footage', 'Search user-approved local folders, Wikimedia Commons, and optional Pexels footage.', {
    query: parameter('string', 'Visual subject, action, mood, and shot type.'),
    provider: parameter("'all' | 'local' | 'wikimedia' | 'pexels'", 'Search provider.', {default: 'all'}),
    localDirectories: parameter('string[]', 'User-approved local folders.'),
    orientation: parameter("'landscape' | 'portrait' | 'square'", 'Required composition orientation.'),
    minDuration: parameter('number', 'Minimum seconds.', {accepted: '>= 0'}),
    maxDuration: parameter('number', 'Maximum seconds.', {accepted: '> 0'}),
    minWidth: parameter('integer', 'Minimum pixel width.', {accepted: '> 0'}),
    minHeight: parameter('integer', 'Minimum pixel height.', {accepted: '> 0'}),
    pageSize: parameter('integer', 'Results requested.', {default: 12, accepted: '1..50'}),
    includeShareAlike: parameter('boolean', 'Allow compatible share-alike results.', {default: false}),
  }, {pitfalls: ['Inspect the preview and source page; titles are insufficient.', 'Preserve attribution and share-alike obligations.']}),
  tool('download_free_video', 'Download Free Video Footage', 'Download selected Wikimedia or Pexels footage with machine-readable credits.', {
    provider: parameter("'wikimedia' | 'pexels'", 'Provider returned by search.', {required: true}),
    id: parameter('numeric string', 'Provider media id.', {required: true}),
    outputDir: parameter('path string', 'Licensed source-media directory.', {required: true}),
    includeShareAlike: parameter('boolean', 'Confirm share-alike acceptance.', {default: false}),
  }),
  tool('search_free_assets', 'Search Free Visual Assets', 'Search licensed local, Openverse, Wikimedia, and optional Pexels images, SVGs, and animations.', {
    query: parameter('string', 'Visual subject, style, and intended use.'),
    provider: parameter("'all' | 'local' | 'openverse' | 'wikimedia' | 'pexels'", 'Search provider.', {default: 'all'}),
    localDirectories: parameter('string[]', 'User-approved local folders.'),
    kind: parameter("'all' | 'image' | 'svg' | 'animation'", 'Asset kind.', {default: 'all'}),
    orientation: parameter("'landscape' | 'portrait' | 'square'", 'Desired orientation.'),
    minWidth: parameter('integer', 'Minimum pixel width.', {accepted: '> 0'}),
    minHeight: parameter('integer', 'Minimum pixel height.', {accepted: '> 0'}),
    pageSize: parameter('integer', 'Results requested.', {default: 12, accepted: '1..50'}),
    includeShareAlike: parameter('boolean', 'Allow compatible share-alike results.', {default: false}),
  }),
  tool('download_free_asset', 'Download Free Visual Asset', 'Download a selected free visual asset with source and license manifests.', {
    provider: parameter("'openverse' | 'wikimedia' | 'pexels'", 'Provider returned by search.', {required: true}),
    id: parameter('string', 'Exact provider media id.', {required: true}),
    outputDir: parameter('path string', 'Licensed asset directory.', {required: true}),
    includeShareAlike: parameter('boolean', 'Confirm share-alike acceptance.', {default: false}),
  }),
  tool('mix_music', 'Mix Music With Timeline Automation', 'Add or replace final music using a frame-evaluated volume envelope without rerendering video.', {
    inputVideo: parameter('path string', 'Existing MP4.', {required: true}),
    music: parameter('path string', 'Selected licensed audio.', {required: true}),
    output: parameter('MP4 path string', 'New output file.', {required: true}),
    baseVolume: parameter('number', 'Overall music gain.', {default: 0.25, accepted: '0..4'}),
    sourceOffset: parameter('number', 'Seconds skipped at music start.', {default: 0, accepted: '>= 0'}),
    loop: parameter('boolean', 'Loop short music.', {default: true}),
    preserveOriginalAudio: parameter('boolean', 'Retain source audio.', {default: false}),
    originalVolume: parameter('number', 'Source-audio gain.', {default: 1, accepted: '0..4'}),
    envelope: parameter('{time:number, volume:number}[]', 'Strictly time-ascending automation points; volume multiplies baseVolume.', {default: [{time: 0, volume: 1}], accepted: '1..100 points; time >= 0; volume 0..4'}),
  }, {pitfalls: ['Author cues from the selected track analysis; do not apply a generic envelope.']}),
  tool('validate_video_plan', 'Validate Legacy JSON Video Plan', 'Validate an existing v1 JSON plan only.', {
    specPath: parameter('path string', 'Existing legacy video JSON.', {required: true}),
  }, {avoidWhen: ['Starting any new production.']}),
  tool('render_video', 'Render Legacy JSON Video', 'Render an existing v1 fixed-layout JSON video.', {
    specPath: parameter('path string', 'Validated legacy plan.', {required: true}),
    workers: parameter('integer', 'Renderer workers.', {accepted: '1..12'}),
    keepFrames: parameter('boolean', 'Retain intermediate frames.'),
  }, {avoidWhen: ['Starting a new code-first Revideo composition.']}),
  tool('probe_video', 'Probe Rendered Video', 'Read duration, dimensions, frame rate, codecs, file size, and audio presence.', {
    videoPath: parameter('path string', 'Rendered media file.', {required: true}),
  }),
  tool('extract_review_frames', 'Extract Review Frames', 'Extract exact still frames for focused visual inspection.', {
    videoPath: parameter('path string', 'Rendered video.', {required: true}),
    outputDir: parameter('path string', 'Review-frame directory.', {required: true}),
    times: parameter('number[]', 'Timestamps in seconds.', {required: true, accepted: '1..20 values, each >= 0'}),
  }),
  tool('create_visual_review_pack', 'Create Visual Review Pack', 'Create overview sheets, transition strips, anomaly candidates, and the mandatory visual checklist.', {
    videoPath: parameter('path string', 'Full render or changed-range render.', {required: true}),
    outputDir: parameter('path string', 'Fresh review directory.', {required: true}),
    overviewInterval: parameter('number', 'Seconds between overview samples.', {default: 2, accepted: '0.25..10'}),
    transitionTimes: parameter('number[]', 'Every authored cut or transition boundary.', {default: [], accepted: '0..30 values'}),
    transitionWindow: parameter('number', 'Seconds sampled around each transition.', {default: 1, accepted: '0.25..3'}),
    transitionFps: parameter('number', 'Strip sampling rate.', {default: 4, accepted: '1..12'}),
  }, {workflow: ['Generate after every full render or changed range.', 'Read every returned sheet.', 'Document and correct material anomalies.', 'Regenerate after correction.'], related: ['tool:read_visual_files', 'topic:visual-review']}),
  tool('read_visual_files', 'Read Review Sheets and Visual Assets', 'Return local images as MCP image content for direct vision inspection.', {
    paths: parameter('string[]', 'PNG, JPEG, WebP, GIF, or SVG paths.', {required: true, accepted: '1..12 files; 15 MB each; 40 MB total'}),
  }, {pitfalls: ['Reading the manifest is not equivalent to visually inspecting the images.']}),
  tool('list_motion_capabilities', 'List Motion Capabilities', 'Return the broad rendering and authoring capability map.', {}),
  tool('list_format_profiles', 'List Format Profiles', 'List or resolve landscape, portrait, square, and platform safe-area profiles.', {
    format: parameter("'landscape' | 'portrait' | 'square'", 'Optional format id.'),
    platform: parameter("'generic' | 'tiktok' | 'instagram-reels' | 'youtube-shorts'", 'Optional platform target.'),
  }),
  tool('prepare_caption_timing', 'Prepare Caption Timing', 'Normalize SRT, WebVTT, cue JSON, or exact word timing into deterministic caption JSON.', {
    inputPath: parameter('path string', 'Caption/timing source.', {required: true}),
    outputPath: parameter('path string', 'Optional normalized JSON destination.'),
  }, {pitfalls: ['Cue-only interpolation remains approximate and must stay labeled cue-interpolated.'], related: ['tool:review_caption_timing']}),
  tool('review_caption_timing', 'Review Caption Timing', 'Check normalized captions for ranges, overlap, density, speed, and approximate timing.', {
    captionTimingPath: parameter('path string', 'Normalized caption JSON.', {required: true}),
  }),
  tool('search_motion_components', 'Search Motion Components', 'Search the reusable motion vocabulary by narrative need and art direction.', {
    query: parameter('string', 'Narrative function or visual behavior.'),
    categories: parameter('MotionComponentCategory[]', `One or more of ${motionComponentCategories.join(', ')}.`),
    tags: parameter('string[]', 'Required tag matches.', {accepted: '0..12'}),
    moods: parameter('string[]', 'Desired mood matches.', {accepted: '0..12'}),
    energy: parameter("('quiet' | 'measured' | 'energetic' | 'impact')[]", 'Desired energy.'),
    limit: parameter('integer', 'Maximum results.', {default: 12, accepted: '1..100'}),
  }, {workflow: ['Search separate shot needs separately.', 'Use exact contextual help on shortlisted components before authoring.'], related: ['tool:help', 'tool:get_motion_component']}),
  tool('get_motion_component', 'Get Motion Component Summary', 'Get compact catalog metadata for one component.', {
    id: parameter('string', 'Exact component id from search_motion_components.', {required: true}),
  }, {notes: 'For parameter types, calibrated values, failure modes, and validation, call help with component:<id>.', related: ['tool:help']}),
  tool('scaffold_advanced_video', 'Scaffold Revideo Composition', 'Create one neutral code-first project with reusable primitives and no predesigned visual style.', {
    outputDir: parameter('path string', 'New project directory.', {required: true}),
    name: parameter('string', 'Production name.', {required: true}),
    format: parameter("'landscape' | 'portrait' | 'square'", 'Composition format.'),
    platform: parameter("'generic' | 'tiktok' | 'instagram-reels' | 'youtube-shorts'", 'Safe-area target.'),
    width: parameter('integer', 'Custom width.', {accepted: '640..3840'}),
    height: parameter('integer', 'Custom height.', {accepted: '360..3840'}),
    fps: parameter('integer', 'Frame rate.', {default: 30, accepted: '24..60'}),
  }, {pitfalls: ['Scaffold once. Do not render it as a template and replace everything later.']}),
  tool('list_advanced_video_files', 'List Advanced Video Files', 'List editable files before reading or patching an existing project.', {
    projectDir: parameter('path string', 'Scaffolded project directory.', {required: true}),
  }),
  tool('read_advanced_video_file', 'Read Advanced Video Source', 'Read one source file inside a scaffolded project.', {
    projectDir: parameter('path string', 'Project directory.', {required: true}),
    relativePath: parameter('string', 'Safe path relative to projectDir.', {required: true}),
  }),
  tool('save_advanced_video_file', 'Save Advanced Video Source', 'Create or replace an editable source file inside the project.', {
    projectDir: parameter('path string', 'Project directory.', {required: true}),
    relativePath: parameter('string', 'Safe relative TypeScript, CSS, JSON, or SVG path.', {required: true}),
    source: parameter('string', 'Complete source text.', {required: true}),
  }),
  tool('patch_advanced_video_file', 'Patch Advanced Video Source', 'Replace exact source fragments without recreating the project.', {
    projectDir: parameter('path string', 'Project directory.', {required: true}),
    relativePath: parameter('string', 'Safe relative source path.', {required: true}),
    patches: parameter('{find:string, replace:string}[]', 'Exact, unique replacements.', {required: true, accepted: '1..50'}),
  }, {pitfalls: ['Read the current source immediately before patching.', 'Do not use a broad fragment that occurs more than once.']}),
  tool('render_advanced_video', 'Render Revideo Composition', 'Render the code-first composition with progress, cancellation, timeout protection, and cleanup.', {
    projectFile: parameter('path string', 'Revideo project.tsx.', {required: true}),
    output: parameter('MP4 path string', 'Output file.', {required: true}),
    variables: parameter('record<string, unknown>', 'Optional Revideo project variables.'),
    workers: parameter('integer', 'Parallel workers.', {default: 1, accepted: '1..8', recommended: 'Start with 1 for stability; increase only after a successful render.'}),
    width: parameter('integer', 'Optional render width.', {accepted: '640..3840'}),
    height: parameter('integer', 'Optional render height.', {accepted: '360..2160'}),
    rangeStart: parameter('number', 'Optional changed-range start in seconds.', {accepted: '>= 0'}),
    rangeEnd: parameter('number', 'Optional changed-range end in seconds.', {accepted: '> rangeStart'}),
    startupTimeoutSeconds: parameter('integer', 'Maximum renderer startup time.', {default: 120, accepted: '10..900'}),
    stallTimeoutSeconds: parameter('integer', 'Maximum time without render progress.', {default: 300, accepted: '10..3600'}),
    maxRenderSeconds: parameter('integer', 'Absolute render deadline.', {default: 7200, accepted: '30..86400'}),
  }, {
    prerequisites: ['An automatic Revideo 0.11 scene-tree preflight runs before Chromium starts and blocks nested JSX collections that would render invisibly.'],
    workflow: ['Render.', 'If preflight reports REV011_NESTED_JSX_FRAGMENT_MAP or REV011_NESTED_JSX_ARRAY_MAP, load topic:revideo-scene-tree and fix the reported file/line.', 'Probe the result.', 'Create and directly inspect a fresh review pack.'],
    related: ['topic:revideo-scene-tree', 'tool:probe_video', 'tool:create_visual_review_pack'],
  }),
  tool('edit_capture_image', 'Edit Capture Image', 'Create a non-destructive crop, resize, correction, blur, or redaction derivative.', {
    input: parameter('path string', 'Source image.', {required: true}), output: parameter('path string', 'New image.', {required: true}),
    crop: parameter('{x,y,width,height}', 'Non-negative crop rectangle.'), resize: parameter('{width,height,fit,background}', 'Positive dimensions; fit contain, cover, or stretch.'),
    color: parameter('{brightness,contrast,saturation,gamma}', 'brightness -1..1; contrast/saturation 0..3; gamma 0.1..10.'), blur: parameter('number', 'Blur strength.', {accepted: '0..100'}),
  }),
  tool('edit_video', 'Edit Video', 'Create a non-destructive revised MP4 using trim, speed, crop, resize, correction, blur, fades, or audio changes.', {
    input: parameter('path string', 'Source video.', {required: true}), output: parameter('MP4 path string', 'New output.', {required: true}),
    start: parameter('number', 'Trim start seconds.', {accepted: '>= 0'}), end: parameter('number', 'Trim end seconds.', {accepted: '> start'}), speed: parameter('number', 'Playback speed.', {default: 1, accepted: '0.25..4'}),
    crop: parameter('{x,y,width,height}', 'Non-negative crop rectangle.'), resize: parameter('{width,height,fit,background}', 'Positive output size.'), color: parameter('{brightness,contrast,saturation,gamma}', 'Color correction.'),
    blur: parameter('number', 'Blur strength.', {accepted: '0..100'}), fadeIn: parameter('number', 'Fade-in seconds.', {default: 0, accepted: '0..10'}), fadeOut: parameter('number', 'Fade-out seconds.', {default: 0, accepted: '0..10'}), volume: parameter('number', 'Audio gain.', {default: 1, accepted: '0..4'}), mute: parameter('boolean', 'Remove audio.', {default: false}),
  }),
  tool('replace_video_range', 'Replace Final Video Range', 'Replace one exact interval in a final MP4 with a separately reviewed replacement.', {
    original: parameter('path string', 'Accepted base MP4.', {required: true}), replacement: parameter('path string', 'Reviewed replacement interval.', {required: true}), output: parameter('MP4 path string', 'New final.', {required: true}), start: parameter('number', 'Range start.', {required: true, accepted: '>= 0'}), end: parameter('number', 'Range end.', {required: true, accepted: '> start'}),
  }, {prerequisites: ['Replacement duration and boundaries must match the intended timeline.', 'Review the changed range before replacement.']}),
  tool('clean_delivery_output', 'Clean Final Delivery Output', 'Remove temporary render debris only after all named final deliverables exist.', {
    outputDir: parameter('path string', 'Delivery-only directory.', {required: true}), keepFiles: parameter('string[]', 'Exact final filenames to preserve.', {required: true, accepted: '1..20'}),
  }, {pitfalls: ['Never point this at source, capture, licensed-media, or user-input directories.']}),
];

const liquidGlassTextParameters: Record<string, HelpParameter> = {
  text: parameter('string', 'One short display word or compact logo text.', {required: true, recommended: 'Usually 3–10 characters; avoid paragraphs, captions, and thin copy.'}),
  fontFamily: parameter('string', 'Installed or project-loaded display family.', {recommended: 'Heavy sans or another shape with broad glyph interiors.'}),
  fontSize: parameter('number | reactive signal', 'Display size in composition pixels.', {recommended: 'Large enough that glyph interiors visibly refract the background; around 140–240 px in a 1080-wide hero is a useful starting range.'}),
  fontWeight: parameter('number | string', 'Font weight.', {recommended: '800–900', constraints: ['Thin strokes cannot carry a readable lens interior.']}),
  refraction: parameter('number | reactive signal', 'Strength of destination-texture displacement.', {default: 0.038, recommended: 'Settle around 0.035–0.055 for hero text; begin near 0.01–0.02 during materialization.', constraints: ['Treat values above 0.075 as experimental and inspect every glyph.', 'Increase only when the background contains useful structure.']}),
  dispersion: parameter('number | reactive signal', 'Chromatic separation around refracted edges.', {default: 0.0045, recommended: 'About 0.0035–0.006 in the settled hero state.', constraints: ['Keep dispersion roughly <= refraction × 0.14.', 'Excess dispersion reads as RGB glitch rather than glass.']}),
  thickness: parameter('number | reactive signal', 'Perceived optical thickness and edge volume.', {default: 0.72, recommended: '0.68–0.9 for heavy display type.', constraints: ['High thickness needs broad glyph interiors and generous spacing.']}),
  reveal: parameter('number | reactive signal', 'Materialization progress through the glyph mask.', {default: 1, recommended: 'Animate approximately -0.16 → 1.05; do not first show the settled word and then reveal it.'}),
  lightAngle: parameter('number | reactive signal', 'Highlight direction in radians.', {default: -0.65, recommended: 'Move continuously across the shot or couple it to the scene light.'}),
  phase: parameter('number | reactive signal', 'Liquid deformation phase.', {default: 0, recommended: 'Animate continuously and linearly for the full visible shot; a static number produces a frozen material.'}),
  sweep: parameter('number | reactive signal', 'Specular/refractive sweep position across the word.', {default: -0.2, recommended: 'Travel from about -0.25 through the word to 1.2–1.35.'}),
  tint: parameter('[number, number, number] | reactive signal', 'Linear RGB material tint.', {default: [0.82, 0.93, 1], recommended: 'Derive from art direction and test over both light and dark regions.'}),
  opacity: parameter('number | reactive signal', 'Whole-node opacity inherited from Txt.', {recommended: 'Keep at 0 before reveal setup; expose only after the hidden material state is ready.'}),
  letterSpacing: parameter('number', 'Tracking inherited from Txt.', {recommended: 'Measure the actual word; moderate negative tracking is acceptable for heavy hero type but must not collapse refractive edges.'}),
};

const opticalGlassParameters: Record<string, HelpParameter> = {
  width: parameter('number | reactive signal', 'Surface width in pixels.', {default: 640}),
  height: parameter('number | reactive signal', 'Surface height in pixels.', {default: 180}),
  radius: parameter('number | reactive signal', 'Corner radius.', {default: 72, constraints: ['Do not exceed half the smaller dimension unless a capsule/circle is intentional.']}),
  bevel: parameter('number | reactive signal', 'Normalized edge-lens width.', {default: 0.46, recommended: '0.35–0.75 depending on shape and scale.'}),
  refraction: parameter('number | reactive signal', 'Destination-texture displacement.', {default: 0.06, recommended: 'About 0.045–0.075 for a primary surface.', constraints: ['Values around 0.1–0.14 are aggressive and frequently look synthetic unless deliberately justified.']}),
  dispersion: parameter('number | reactive signal', 'Chromatic edge separation.', {default: 0.005, recommended: 'About 0.004–0.007 for a primary surface.', constraints: ['Keep proportional to refraction; avoid 0.012–0.016 for normal UI glass.']}),
  reveal: parameter('number | reactive signal', 'Surface materialization progress.', {default: 1, recommended: 'Animate 0 → 1 when the surface is created.'}),
  lightAngle: parameter('number | reactive signal', 'Highlight direction in radians.', {default: -0.8, recommended: 'Move with the scene light for the full shot.'}),
  interaction: parameter('number | reactive signal', 'Temporary press/touch energy.', {default: 0, recommended: 'Briefly rise toward 1 on a motivated interaction and settle near 0.1–0.2.'}),
  phase: parameter('number | reactive signal', 'Liquid deformation phase.', {default: 0, recommended: 'Animate continuously while visible.'}),
  touchPoint: parameter('[number, number] | reactive signal', 'Normalized interaction origin.', {default: [0.72, 0.52], accepted: 'Each coordinate normally 0..1'}),
  tint: parameter('[number, number, number] | reactive signal', 'Linear RGB glass tint.', {default: [0.79, 0.9, 1]}),
  rimWidth: parameter('number | reactive signal', 'Outline width.', {default: 1.5, recommended: 'Usually 1–2.5 px at 1080p.'}),
  rimOpacity: parameter('number | reactive signal', 'Rim opacity.', {default: 1, accepted: '0..1'}),
  shadowBlur: parameter('number | reactive signal', 'Surface lift softness.', {default: 56}),
  shadowOpacity: parameter('number | reactive signal', 'Shadow opacity.', {default: 1, accepted: '0..1'}),
};

const componentOverrides: Record<string, Partial<HelpEntry>> = {
  'liquid-glass-text': {
    contractLevel: 'calibrated',
    parameters: liquidGlassTextParameters,
    prerequisites: [
      'Enable Revideo experimentalFeatures.',
      'Render structured, moving layers behind the text before the LiquidGlassText node; the shader reads destinationTexture.',
      'Use a short, large, heavy word with measurable glyph interiors.',
    ],
    workflow: [
      'Create reactive signals for reveal, refraction, dispersion, thickness, lightAngle, phase, and sweep.',
      'Prepare opacity 0 and the hidden material state before the parent becomes visible.',
      'Run phase, lightAngle, and the structured background continuously for the full visible shot.',
      'Materialize reveal/refraction/dispersion together, then carry sweep completely across the word.',
      'Inspect the word over light, dark, detailed, and low-detail background regions.',
    ],
    example: `const reveal = createSignal(-0.16);\nconst refraction = createSignal(0.012);\nconst dispersion = createSignal(0.0015);\nconst thickness = createSignal(0.72);\nconst phase = createSignal(0);\nconst sweep = createSignal(-0.25);\n\n<LiquidGlassText text={'REFRACT'} fontSize={188} fontWeight={900}\n  refraction={refraction} dispersion={dispersion} thickness={thickness}\n  reveal={reveal} phase={phase} sweep={sweep} tint={[0.82, 0.94, 1]} />\n\n// Run phase continuously in parallel with the authored reveal/sweep choreography.`,
    pitfalls: [
      'A constant phase/sweep with only opacity and scale animation is styled text, not living liquid glass.',
      'Large blurred blobs alone do not provide enough spatial detail for convincing refraction.',
      'Do not reveal a fully settled word before starting materialization.',
      'Do not copy the example palette or word into unrelated productions.',
    ],
    validation: [
      'The initial visible frame contains no flash of the settled word.',
      'Interior refraction is visible, not only a white outline.',
      'Chromatic separation supports the lens edge and does not read as a glitch.',
      'Motion remains alive between narrative beats.',
      'Every letter remains readable at full delivery resolution.',
    ],
    related: ['component:optical-liquid-glass', 'topic:liquid-glass', 'topic:visual-review'],
  },
  'optical-liquid-glass': {
    contractLevel: 'calibrated',
    parameters: opticalGlassParameters,
    prerequisites: [
      'Enable Revideo experimentalFeatures.',
      'Place structured content behind the OpticalGlass node; destinationTexture only contains already-rendered layers.',
    ],
    workflow: [
      'Author the backdrop and glass geometry for the shot.',
      'Start reveal/refraction/dispersion from a restrained state.',
      'Animate phase and light continuously.',
      'Couple interaction and deformation to a visible cause.',
    ],
    pitfalls: ['A static phase creates frozen plastic.', 'Very strong refraction/dispersion obscures content and resembles a generic shader demo.', 'A flat or heavily blurred background gives the lens nothing useful to bend.'],
    validation: ['Refraction changes when the background moves.', 'Content inside the surface remains aligned and readable.', 'Rim, shadow, and tint preserve hierarchy on light and dark regions.'],
    related: ['component:liquid-glass-text', 'topic:liquid-glass'],
  },
  'tracking-reveal': {
    contractLevel: 'calibrated',
    parameters: {
      tracking: parameter('number', 'Initial extra letter spacing in pixels.', {recommended: '18–42 for display text; always settle at the authored final tracking.'}),
      blur: parameter('number', 'Initial blur radius.', {recommended: '8–24 depending on scale.'}),
      duration: parameter('number', 'Reveal duration in seconds.', {recommended: '0.55–1.2'}),
    },
    workflow: ['Call prepareTrackReveal before any parent opacity exposes the text.', 'Expose the parent if needed.', 'Call playTrackReveal at the authored cue.'],
    pitfalls: ['Calling trackReveal after the settled word is already visible creates a flash.'],
    validation: ['No settled-state flash.', 'Final tracking and word spacing are visually measured.'],
  },
  'specular-text-sweep': {
    contractLevel: 'calibrated',
    parameters: {
      angle: parameter('number', 'Sweep angle in degrees/radians as required by the helper.', {recommended: 'Align with scene lighting and travel direction.'}),
      direction: parameter("'left-to-right' | 'right-to-left'", 'Travel direction.'),
      width: parameter('number', 'Soft reflection width.', {recommended: 'Broad enough to read as material light, not a thin scanner line.'}),
      glow: parameter('number', 'Soft highlight glow.', {recommended: 'Keep subordinate to glyph readability.'}),
      duration: parameter('number', 'Crossing duration.', {recommended: '0.8–1.8 seconds for a hero word.'}),
    },
    workflow: ['Create aligned base, soft, and core layers with SpecularTextStack during scene setup.', 'Keep light layers hidden.', 'Run specularTextSweep only after the word has settled.'],
    pitfalls: ['Do not recreate text layers during the shot; it can trigger font relayout.', 'Do not repeat the effect on every line.'],
  },
  'text-push': {
    contractLevel: 'calibrated',
    parameters: {
      gap: parameter('number', 'Optical gap between measured text nodes.', {recommended: 'Measure at the delivery font and size; do not use manual spaces.'}),
      direction: parameter("'left' | 'right'", 'Push direction consistent with scene motion.'),
      overshoot: parameter('number', 'Short settling overshoot.', {recommended: 'Restrained; avoid collisions during the overshoot frame.'}),
    },
    workflow: ['Create all text nodes.', 'Measure/arrange them with arrangeTextRow.', 'Animate outgoing and incoming nodes from those measured positions.'],
    validation: ['Check frames before, during, and after the push for collision and disconnected word spacing.'],
  },
};

function componentParameterFallback(component: MotionComponent): Record<string, HelpParameter> {
  return Object.fromEntries(component.parameters.map((name) => [name, parameter(
    'author-defined value or reactive signal',
    `Conceptual control for ${component.title}. Inspect the source export signature and author it for the current shot; this component has no universal visual default.`,
  )]));
}

function componentHelp(component: MotionComponent, requestedKind: 'component' | 'transition' = 'component'): HelpEntry {
  const override = componentOverrides[component.id] ?? {};
  const isTransition = component.category === 'transition' || requestedKind === 'transition';
  return {
    kind: isTransition ? 'transition' : 'component',
    id: component.id,
    title: component.title,
    summary: component.summary,
    parameters: componentParameterFallback(component),
    sourceExports: component.sourceExports,
    tags: component.tags,
    moods: component.moods,
    energy: component.energy,
    notes: component.compositionNotes,
    contractLevel: 'catalog',
    ...(isTransition ? {
      prerequisites: ['Define the outgoing settled pose, the exact transition boundary, and the incoming settled pose before animating the bridge.'],
      workflow: ['Choose a vector or shared visual cause.', 'Animate outgoing and incoming states with deliberate overlap.', 'Carry direction, scale, color, rhythm, or a meaningful object across the boundary.', 'Generate a transition strip around the exact boundary.'],
      pitfalls: ['Do not add a transition only to hide unrelated compositions.', 'Do not leave stale outgoing layers under the settled destination frame.'],
      validation: ['Inspect frames immediately before, during, and after the boundary.', 'Verify no flash, jump, clipping, mismatched direction, or unreadable blur.', 'Verify the first settled destination frame has intentional hierarchy.'],
    } : {}),
    ...override,
  };
}

const topicHelpEntries: HelpEntry[] = [
  {
    kind: 'topic', id: 'help-workflow', title: 'Progressive Help Workflow',
    summary: 'Keep the working context small by loading documentation only at the point of uncertainty.',
    workflow: ['Use normal tool schemas and the compact motion search for familiar work.', 'Call help with a query only when the id is unknown.', 'Call help with an exact target before a fragile/unfamiliar tool, component, or transition.', 'Retain only the selected contract while authoring and validation.'],
    example: `help({query: 'liquid glass text'})\nhelp({target: 'component:liquid-glass-text'})\nhelp({kind: 'tool', id: 'render_advanced_video'})`,
  },
  {
    kind: 'topic', id: 'liquid-glass', title: 'Liquid Glass Material System',
    summary: 'Liquid glass is a coupled optical material, backdrop, layer-order, and animation contract—not a static shader preset.',
    workflow: ['Choose text lens or surface lens.', 'Load the exact component help.', 'Create a structured moving backdrop.', 'Use reactive signals and calibrated envelopes.', 'Render a short material probe.', 'Inspect light, dark, detailed, and quiet backdrop regions before integration.'],
    pitfalls: ['Static phase/sweep.', 'Excess refraction and dispersion.', 'Flat or blurred-only backdrop.', 'Wrong draw order.', 'Thin or small text.'],
    related: ['component:liquid-glass-text', 'component:optical-liquid-glass'],
  },
  {
    kind: 'topic', id: 'text-layout', title: 'Measured Text Layout',
    summary: 'Position editorial text from explicit anchors and measured bounds instead of treating x/y as left/top edges.',
    workflow: ['Load fonts before final measurement.', 'Choose center or edge anchoring explicitly.', 'For left-aligned text, supply a width plus textAlign=left or an appropriate offset.', 'Measure independently animated words and arrange them as a row.', 'Inspect settled frames at full resolution.'],
    pitfalls: ['Revideo Txt positions are centered unless offset/alignment changes.', 'Manual spaces are not layout.', 'Animating nodes before measuring their final geometry creates collisions and disconnected copy.'],
    validation: ['No text outside its authored region or safe area.', 'No icon/glyph collision.', 'Consistent baselines and optical gaps.', 'No orphaned words or unintended wrap.'],
    related: ['component:text-push', 'component:tracking-reveal', 'topic:visual-review'],
  },
  {
    kind: 'topic', id: 'transitions', title: 'Transition Direction and Continuity',
    summary: 'Ten executable rigs in transitions.ts connect two designed poses through shared motion, scale, color, lighting, rhythm, shape, blur, displacement, or an object.',
    workflow: ['Design both settled poses first.', 'Load exact help for the selected transition.', 'Author its shapes, clones, bounds, strips, vectors, and supporting layers.', 'Customize or rewrite the rig when the story needs different internal choreography.', 'Keep duration proportional to energy.', 'Inspect a dense strip around the boundary.'],
    validation: ['No stale layer, flash, jump, mismatched direction, accidental freeze, or hierarchy collapse.'],
  },
  {
    kind: 'topic', id: 'camera-rigs', title: 'Camera Rigs and Custom Paths',
    summary: 'Seven catalog camera systems have executable helpers in camera.ts, plus cameraPath for unrestricted authored keyframes and Three.js as the true-3D escape hatch.',
    workflow: ['Choose the focal subject and overscan first.', 'Load exact component help.', 'Create separate world, pose, and ambient rigs when signals would conflict.', 'Customize or replace the helper when its path is not the story path.', 'Use Three.js for physical perspective, orbit, lighting, or depth of field.'],
    validation: ['The camera arrives before the semantic event.', 'The focal subject remains legible and inside safe bounds.', 'No exposed frame edges, frozen holds, signal conflicts, or digital-zoom-only feel.'],
    related: ['topic:custom-motion', 'component:dolly-in', 'component:focus-track', 'component:orbit-sweep'],
  },
  {
    kind: 'topic', id: 'custom-motion', title: 'Unrestricted Custom Motion',
    summary: 'The component catalog is optional source material, never a constraint: author any compatible Revideo TypeScript, GLSL, SVG, procedural, or Three.js behavior in the production.',
    workflow: ['Use a rig unchanged only when it already matches the shot.', 'Otherwise restyle, combine, copy and rewrite, or ignore it.', 'Create new helpers directly in the scaffold whenever one-off behavior is stronger.', 'Validate custom work with the same render and visual-review gate.'],
    pitfalls: ['Do not choose a near-matching component merely because it appears in search.', 'Do not assume sourceExports are mandatory.', 'Do not let examples become a repeated house style.'],
  },
  {
    kind: 'topic', id: 'revideo-scene-tree', title: 'Revideo 0.11 Scene-Tree Safety',
    summary: 'Prevent silent black or missing layers when JSX refs exist but nested Fragment/array results from map() were never attached to the Revideo visual tree.',
    sourceExports: ['flattenSceneNodes', 'mapSceneNodes', 'addSceneNodes', 'assertSceneNodeMounted', 'assertSceneNodesMounted'],
    workflow: [
      'Prefer one direct JSX node per map() result.',
      'When one item intentionally creates multiple nodes, use mapSceneNodes() or flattenSceneNodes() from scene-tree.ts before insertion.',
      'Use addSceneNodes() for imperative view/parent insertion.',
      'Use assertSceneNodeMounted() while debugging a custom ref; a non-null ref is not proof that the node is rendered.',
      'Let render_advanced_video preflight the complete local TSX project before Chromium starts.',
    ],
    example: `// Unsafe in Revideo 0.11: map() returns an array through Fragment.\nview.add(<>{items.map(item => <><Rect /><Txt text={item} /></>)}</>);\n\n// Safe: recursively flatten before insertion.\naddSceneNodes(view, mapSceneNodes(items, item => <><Rect /><Txt text={item} /></>));\n\n// Also safe when the nodes do not need to be paired.\nview.add(<>{items.map(item => <Rect />)}{items.map(item => <Txt text={item} />)}</>);`,
    pitfalls: [
      'Revideo 0.11 JSX flattens only one child-array level; Node.insert ignores inner arrays instead of throwing.',
      'Refs may exist and report opacity/position correctly even while their nodes have parent() === null.',
      'Child opacity cannot override an invisible ancestor: parent opacity 0 multiplied by child opacity 1 is still invisible.',
      'Do not “fix” detached nodes with zIndex or opacity; mount the collection correctly.',
    ],
    validation: [
      'Preflight returns valid=true before renderer startup.',
      'Every animated scene root has parent() !== null after insertion.',
      'Every ancestor intended to be visible has nonzero opacity during the shot.',
      'Dense review frames show both outgoing and incoming settled states, not only headers or background.',
    ],
    related: ['tool:render_advanced_video', 'topic:visual-review', 'topic:transitions'],
  },
  {
    kind: 'topic', id: 'visual-review', title: 'Visual Review Gate',
    summary: 'A successful render is not a quality pass; delivery requires direct inspection of overview and transition sheets.',
    workflow: ['Probe the render.', 'Create a fresh review pack with all boundaries.', 'Read every generated image.', 'Record anomalies.', 'Patch source and rerender affected ranges.', 'Regenerate the relevant pack.'],
    validation: ['Typography, spacing, clipping, safe areas, camera continuity, transitions, cursor causality, material effects, and final resolution all pass.'],
    related: ['tool:create_visual_review_pack', 'tool:read_visual_files'],
  },
  {
    kind: 'topic', id: 'ambient-motion', title: 'Continuous Ambient Motion',
    summary: 'Keep selected background, light, parallax, or camera layers alive for the complete visible shot while story beats run.',
    workflow: ['Give ambient and narrative motion separate nested rigs when they affect the same visual object.', 'Run ambient generators concurrently with the main timeline.', 'Keep amplitude subordinate to the focal content.'],
    pitfalls: ['Restarting background movement after every event.', 'Concurrent generators writing the same node signal.', 'Moving every layer equally.'],
  },
  {
    kind: 'topic', id: 'capture', title: 'Product Capture and Recording',
    summary: 'Capture clean proof-bearing product states and flows for later designed composition.',
    workflow: ['Inspect the app.', 'Create a private *.local.json spec.', 'Capture exact states or record meaningful interactions.', 'Preserve masters and compose them inside authored product frames.'],
  },
];

const toolById = new Map(toolHelpEntries.map((entry) => [entry.id, entry]));
const topicById = new Map(topicHelpEntries.map((entry) => [entry.id, entry]));
const componentById = new Map(motionComponentLibrary.map((entry) => [entry.id, entry]));

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[_:\s./]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function targetLikeQuery(query: string): string | undefined {
  const match = /^\s*(tool|component|transition|topic)\s*:\s*(.+?)\s*$/i.exec(query);
  if (!match) return undefined;
  return `${match[1].toLowerCase()}:${match[2]}`;
}

function resolveExact(kind: HelpKind, id: string): HelpEntry | undefined {
  const normalized = normalize(id);
  const searchNormalized = normalizeSearch(id);
  if (kind === 'tool') return toolById.get(normalized) ?? toolHelpEntries.find((entry) => normalizeSearch(entry.id) === searchNormalized);
  if (kind === 'topic') return topicById.get(normalized) ?? topicHelpEntries.find((entry) => normalizeSearch(entry.id) === searchNormalized);
  const component = componentById.get(normalized) ?? motionComponentLibrary.find((entry) => normalizeSearch(entry.id) === searchNormalized);
  if (!component) return undefined;
  if (kind === 'transition' && component.category !== 'transition') return undefined;
  return componentHelp(component, kind === 'transition' ? 'transition' : 'component');
}

function searchableEntries(): HelpEntry[] {
  return [
    ...toolHelpEntries,
    ...motionComponentLibrary.map((entry) => componentHelp(entry)),
    ...topicHelpEntries,
  ];
}

function compact(entry: HelpEntry) {
  return {
    target: `${entry.kind}:${entry.id}`,
    title: entry.title,
    summary: entry.summary,
    ...(entry.kind === 'component' || entry.kind === 'transition' ? {contractLevel: entry.contractLevel} : {}),
  };
}

export interface GetHelpOptions {
  target?: string;
  kind?: HelpKind;
  id?: string;
  query?: string;
  limit?: number;
}

export function getContextualHelp(options: GetHelpOptions = {}) {
  const limit = Math.max(1, Math.min(30, options.limit ?? 12));
  let kind = options.kind;
  let id = options.id;

  if (options.target) {
    const separator = options.target.indexOf(':');
    if (separator > 0) {
      const prefix = normalize(options.target.slice(0, separator));
      if ((helpKinds as readonly string[]).includes(prefix)) kind = prefix as HelpKind;
      id = options.target.slice(separator + 1);
    } else {
      id = options.target;
    }
  }

  if (id && kind) {
    const entry = resolveExact(kind, id);
    return entry
      ? {mode: 'detail', target: `${entry.kind}:${entry.id}`, help: entry}
      : {mode: 'not-found', requested: `${kind}:${id}`, suggestions: searchHelp(`${kind} ${id}`, limit)};
  }

  if (id) {
    const matches = helpKinds.flatMap((candidateKind) => {
      const entry = resolveExact(candidateKind, id!);
      return entry ? [entry] : [];
    });
    if (matches.length === 1) return {mode: 'detail', target: `${matches[0].kind}:${matches[0].id}`, help: matches[0]};
    if (matches.length > 1) return {mode: 'ambiguous', requested: id, candidates: matches.map(compact)};
    return {mode: 'not-found', requested: id, suggestions: searchHelp(id, limit)};
  }

  if (options.query) {
    const promotedTarget = targetLikeQuery(options.query);
    if (promotedTarget) return getContextualHelp({target: promotedTarget, limit});
    return {mode: 'search', query: options.query, results: searchHelp(options.query, limit)};
  }

  const categoryCounts = Object.fromEntries(motionComponentCategories.map((category) => [
    category,
    motionComponentLibrary.filter((entry) => entry.category === category).length,
  ]));
  return {
    mode: 'index',
    purpose: 'Progressive documentation: search compactly, then load one exact target.',
    usage: [
      {query: {query: 'liquid glass text'}},
      {exactTarget: {target: 'component:liquid-glass-text'}},
      {exactFields: {kind: 'tool', id: 'render_advanced_video'}},
      {transition: {kind: 'transition', id: 'camera-zoom-through'}},
    ],
    counts: {
      tools: toolHelpEntries.length,
      components: motionComponentLibrary.length,
      transitions: motionComponentLibrary.filter((entry) => entry.category === 'transition').length,
      topics: topicHelpEntries.length,
    },
    componentCategories: categoryCounts,
    topics: topicHelpEntries.map(compact),
    note: 'Do not load every entry. Request the exact target only when authoring or debugging it.',
  };
}

function searchHelp(query: string, limit: number) {
  const terms = normalizeSearch(query).split('-').filter(Boolean);
  return searchableEntries()
    .map((entry) => {
      const normalizedId = normalizeSearch(entry.id);
      const haystack = normalizeSearch([
        entry.kind, entry.id, entry.title, entry.summary,
        ...(entry.tags ?? []), ...(entry.sourceExports ?? []), ...(entry.related ?? []),
      ].join(' '));
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? (normalizedId.includes(term) ? 4 : 1) : 0), 0);
      return {entry, score};
    })
    .filter(({score}) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id))
    .slice(0, limit)
    .map(({entry}) => compact(entry));
}
