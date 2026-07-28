import { z } from 'zod';

export const TransitionSchema = z.enum(['fade', 'push', 'wipe', 'zoom']);
export type Transition = z.infer<typeof TransitionSchema>;

export const FocusSchema = z.object({
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.5),
  scale: z.number().min(1).max(2.5).default(1.08),
});

export const SceneSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['hero', 'product', 'features', 'metrics', 'cta']),
  duration: z.number().positive(),
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  media: z.string().optional(),
  transition: TransitionSchema.default('fade'),
  focus: FocusSchema.optional(),
  bullets: z.array(z.string()).max(6).optional(),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })).max(4).optional(),
  badge: z.string().optional(),
  align: z.enum(['left', 'center']).default('left'),
});

export const VideoSpecSchema = z.object({
  version: z.literal(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  width: z.number().int().min(640).max(3840).default(1920),
  height: z.number().int().min(360).max(2160).default(1080),
  fps: z.number().int().min(24).max(60).default(30),
  duration: z.number().positive().max(180),
  brand: z.object({
    name: z.string().min(1),
    logo: z.string().optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#7c5cff'),
    accent2: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#31d0aa'),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#070a12'),
    foreground: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#f7f8ff'),
    fontFamily: z.string().default('Inter, ui-sans-serif, system-ui, sans-serif'),
  }),
  scenes: z.array(SceneSchema).min(1).max(24),
  music: z.object({
    track: z.string().min(1),
    volume: z.number().min(0).max(1).default(0.18),
  }).optional(),
  output: z.string().min(1),
}).superRefine((spec, ctx) => {
  const sceneDuration = spec.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  if (Math.abs(sceneDuration - spec.duration) > 0.001) {
    ctx.addIssue({
      code: 'custom',
      path: ['scenes'],
      message: `Scene durations total ${sceneDuration}s but video duration is ${spec.duration}s`,
    });
  }
});

export type Scene = z.infer<typeof SceneSchema>;
export type VideoSpec = z.infer<typeof VideoSpecSchema>;

export const BrowserActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), selector: z.string(), delayMs: z.number().int().nonnegative().optional() }),
  z.object({ type: z.literal('fill'), selector: z.string(), value: z.string(), delayMs: z.number().int().nonnegative().optional() }),
  z.object({ type: z.literal('press'), selector: z.string(), key: z.string(), delayMs: z.number().int().nonnegative().optional() }),
  z.object({ type: z.literal('hover'), selector: z.string(), delayMs: z.number().int().nonnegative().optional() }),
  z.object({ type: z.literal('select'), selector: z.string(), value: z.string(), delayMs: z.number().int().nonnegative().optional() }),
  z.object({ type: z.literal('check'), selector: z.string(), checked: z.boolean().default(true), delayMs: z.number().int().nonnegative().optional() }),
  z.object({ type: z.literal('scroll'), deltaX: z.number().default(0), deltaY: z.number(), delayMs: z.number().int().nonnegative().optional() }),
  z.object({ type: z.literal('mouse'), x: z.number().nonnegative(), y: z.number().nonnegative(), steps: z.number().int().positive().max(120).default(24), delayMs: z.number().int().nonnegative().optional() }),
  z.object({ type: z.literal('goto'), url: z.string().min(1), delayMs: z.number().int().nonnegative().optional() }),
  z.object({ type: z.literal('wait'), ms: z.number().int().positive() }),
]);

const CaptureTargetSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  path: z.string(),
  waitFor: z.string().optional(),
  delayMs: z.number().int().nonnegative().default(800),
  actions: z.array(BrowserActionSchema).optional(),
  fullPage: z.boolean().default(false),
});

const RecordingTargetSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  path: z.string(),
  waitFor: z.string().optional(),
  settleMs: z.number().int().nonnegative().default(800),
  preRollMs: z.number().int().nonnegative().default(500),
  postRollMs: z.number().int().nonnegative().default(800),
  actions: z.array(BrowserActionSchema).min(1),
  pointer: z.enum(['hidden', 'annotated']).default('hidden'),
});

export const CaptureSpecSchema = z.object({
  baseUrl: z.string().url(),
  outputDir: z.string().min(1),
  viewport: z.object({
    width: z.number().int().min(800).max(2560).default(1600),
    height: z.number().int().min(600).max(1600).default(1000),
  }).default({ width: 1600, height: 1000 }),
  auth: z.object({
    path: z.string().default('/login'),
    fields: z.array(z.object({ selector: z.string(), value: z.string() })).min(1),
    submit: z.string(),
    waitForUrl: z.string().optional(),
  }).optional(),
  targets: z.array(CaptureTargetSchema).default([]),
  recordings: z.array(RecordingTargetSchema).default([]),
}).superRefine((spec, ctx) => {
  if (spec.targets.length === 0 && spec.recordings.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['targets'],
      message: 'Capture spec requires at least one screenshot target or recording',
    });
  }
});

export type CaptureSpec = z.infer<typeof CaptureSpecSchema>;
export type BrowserAction = z.infer<typeof BrowserActionSchema>;

export interface AudioTrack {
  id: string;
  title: string;
  file: string;
  bpm: number;
  mood: string[];
  intensity: number;
  loopable: boolean;
  license: 'CC0-1.0';
}

export interface MusicSearchResult {
  provider: 'bundled' | 'local' | 'openverse';
  source?: string;
  id: string;
  title: string;
  creator?: string;
  duration?: number;
  license: string;
  licenseUrl?: string;
  attribution?: string;
  tags: string[];
  localPath?: string;
  downloadUrl?: string;
  landingUrl?: string;
  selectable: boolean;
}

export type FreeMediaKind = 'video' | 'image' | 'svg' | 'animation';
export type FreeMediaProvider = 'local' | 'openverse' | 'wikimedia' | 'pexels' | 'pixabay';
export type MediaOrientation = 'landscape' | 'portrait' | 'square';

export interface FreeMediaSearchResult {
  provider: FreeMediaProvider;
  kind: FreeMediaKind;
  id: string;
  title: string;
  creator?: string;
  duration?: number;
  width?: number;
  height?: number;
  orientation?: MediaOrientation;
  mimeType?: string;
  fileSize?: number;
  license: string;
  licenseUrl?: string;
  attribution?: string;
  tags: string[];
  localPath?: string;
  downloadUrl?: string;
  previewUrl?: string;
  landingUrl?: string;
  selectable: boolean;
  requiresAttribution: boolean;
  requiresShareAlike: boolean;
  licenseReason?: string;
}

export interface RenderResult {
  outputPath: string;
  duration: number;
  frames: number;
  width: number;
  height: number;
  fps: number;
  audioTrack?: string;
}
