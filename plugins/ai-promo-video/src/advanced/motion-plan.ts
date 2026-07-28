import { readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { z } from 'zod';
import type { VideoFormatProfile } from './formats.js';

const normalizedBoundsSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().positive().max(1),
  height: z.number().positive().max(1),
}).superRefine((bounds, context) => {
  if (bounds.x + bounds.width > 1.000_001) {
    context.addIssue({ code: 'custom', message: 'x + width must stay inside the normalized frame' });
  }
  if (bounds.y + bounds.height > 1.000_001) {
    context.addIssue({ code: 'custom', message: 'y + height must stay inside the normalized frame' });
  }
});

const reviewMomentSchema = z.object({
  time: z.number().nonnegative(),
  label: z.string().min(1),
  kind: z.enum(['settle', 'transition', 'hold', 'custom']).default('custom'),
});

const motionRegionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  bounds: normalizedBoundsSchema,
  source: z.string().min(1).optional(),
  expectedMotion: z.enum(['continuous', 'may-settle', 'intentional-stillness']).default('continuous'),
});

const intervalSchema = z.object({
  start: z.number().nonnegative(),
  end: z.number().positive(),
  reason: z.string().min(1),
}).refine((interval) => interval.end > interval.start, {
  message: 'Intentional-stillness end must be after start',
});

export const shotBoundaryModes = ['continuous', 'motivated-cut', 'intentional-stop'] as const;

const shotBoundarySchema = z.object({
  mode: z.enum(shotBoundaryModes),
  carrier: z.string().min(1).optional(),
  intent: z.string().min(1),
}).superRefine((boundary, context) => {
  if (boundary.mode !== 'intentional-stop' && !boundary.carrier?.trim()) {
    context.addIssue({
      code: 'custom',
      path: ['carrier'],
      message: 'carrier is required for continuous and motivated-cut boundaries',
    });
  }
});

const shotSchema = z.object({
  id: z.string().min(1),
  start: z.number().nonnegative(),
  end: z.number().positive(),
  subjectRegionId: z.string().min(1).optional(),
  motionIntent: z.enum(['continuous', 'intentional-stillness', 'mixed']),
  subjectMotion: z.string().min(1),
  backgroundMotion: z.string().min(1),
  midgroundMotion: z.string().min(1).optional(),
  foregroundMotion: z.string().min(1).optional(),
  cameraPath: z.string().min(1),
  velocityBridges: z.array(z.string().min(1)).default([]),
  boundaryToNext: shotBoundarySchema.optional(),
}).refine((shot) => shot.end > shot.start, {
  message: 'Shot end must be after start',
});

export const MotionPlanSchema = z.object({
  version: z.literal(1),
  format: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    platform: z.string().min(1),
  }),
  direction: z.object({
    audience: z.string(),
    promise: z.string(),
    visualConcept: z.string(),
    movementPrinciple: z.string(),
  }),
  shots: z.array(shotSchema),
  regions: z.array(motionRegionSchema),
  reviewMoments: z.array(reviewMomentSchema),
  intentionalStillness: z.array(intervalSchema),
}).superRefine((plan, context) => {
  const regionIds = new Set(plan.regions.map((region) => region.id));
  for (const [index, shot] of plan.shots.entries()) {
    if (shot.subjectRegionId && !regionIds.has(shot.subjectRegionId)) {
      context.addIssue({
        code: 'custom',
        path: ['shots', index, 'subjectRegionId'],
        message: `Unknown motion region: ${shot.subjectRegionId}`,
      });
    }
  }
});

export type NormalizedBounds = z.infer<typeof normalizedBoundsSchema>;
export type MotionPlan = z.infer<typeof MotionPlanSchema>;

export const motionPlanAuthoringGuide = {
  purpose: 'Plan logical shots inside one master Revideo scene, then validate this file before the first render.',
  requiredDirectionFields: ['audience', 'promise', 'visualConcept', 'movementPrinciple'],
  requiredShotFields: ['id', 'start', 'end', 'motionIntent', 'subjectMotion', 'backgroundMotion', 'cameraPath', 'velocityBridges'],
  normalizedRegionBounds: 'x, y, width, and height use normalized 0..1 frame coordinates.',
  boundaryToNext: {
    required: 'Every shot except the final shot.',
    fields: ['mode', 'intent', 'carrier unless mode is intentional-stop'],
    modes: {
      continuous: 'Preserve literal subject, object, or camera motion through the boundary.',
      'motivated-cut': 'A cut is allowed, but direction, scale, position, shape, color/light, rhythm/audio, or a shared object must carry perceptual continuity.',
      'intentional-stop': 'A deliberate full stop supports reading, tension, impact, or resolution; explain why in intent.',
    },
  },
  exampleShot: {
    id: 'shot-01',
    start: 0,
    end: 3.2,
    subjectRegionId: 'hero-subject',
    motionIntent: 'continuous',
    subjectMotion: 'The focal subject advances through the whole shot and settles only at the declared review moment.',
    backgroundMotion: 'A restrained persistent depth layer continues beneath the story action.',
    cameraPath: 'One authored path carries velocity through the internal beats.',
    velocityBridges: ['The final camera direction becomes the next shot entry direction.'],
    boundaryToNext: {
      mode: 'motivated-cut',
      carrier: 'camera direction and focal position',
      intent: 'The cut preserves rightward travel and the subject remains on the same visual axis.',
    },
  },
  nextTool: 'validate_motion_plan',
} as const;

export function defaultMotionPlan(profile: VideoFormatProfile): MotionPlan {
  return {
    version: 1,
    format: {
      width: profile.width,
      height: profile.height,
      platform: profile.platform,
    },
    direction: {
      audience: '',
      promise: '',
      visualConcept: '',
      movementPrinciple: '',
    },
    shots: [],
    regions: [],
    reviewMoments: [],
    intentionalStillness: [],
  };
}

export async function readMotionPlan(path: string): Promise<MotionPlan> {
  const absolutePath = resolve(path);
  return MotionPlanSchema.parse(JSON.parse(await readFile(absolutePath, 'utf8')) as unknown);
}

export type QualityLintSeverity = 'info' | 'warning' | 'error';

export interface QualityLintIssue {
  severity: QualityLintSeverity;
  code: string;
  message: string;
  file?: string;
  relativeFile?: string;
  line?: number;
  suggestion?: string;
}

export interface AdvancedQualityLint {
  passed: boolean;
  projectFile: string;
  motionPlanPath?: string;
  issues: QualityLintIssue[];
}

export interface MotionPlanValidation {
  valid: boolean;
  motionPlanPath: string;
  durationSeconds?: number;
  shotCount: number;
  issues: QualityLintIssue[];
  authoringGuide: typeof motionPlanAuthoringGuide;
}

async function inspectMotionPlan(pathInput: string): Promise<{
  plan?: MotionPlan;
  validation: MotionPlanValidation;
}> {
  const motionPlanPath = resolve(pathInput);
  const issues: QualityLintIssue[] = [];
  let plan: MotionPlan | undefined;

  try {
    plan = await readMotionPlan(motionPlanPath);
  } catch (error) {
    if (error instanceof z.ZodError) {
      for (const issue of error.issues) {
        issues.push({
          severity: 'error',
          code: 'MOTION_PLAN_SCHEMA',
          message: `${issue.path.join('.') || 'motion-plan.json'}: ${issue.message}`,
          file: motionPlanPath,
          relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
          suggestion: 'Follow the returned authoringGuide, repair this exact field, and validate again.',
        });
      }
    } else {
      issues.push({
        severity: 'error',
        code: 'MOTION_PLAN_INVALID',
        message: error instanceof Error ? error.message : String(error),
        file: motionPlanPath,
        relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
        suggestion: 'Follow the returned authoringGuide, repair the JSON, and validate again.',
      });
    }
  }

  if (plan) {
    if (!plan.direction.visualConcept.trim() || !plan.direction.movementPrinciple.trim()) {
      issues.push({
        severity: 'error',
        code: 'MOTION_DIRECTION_EMPTY',
        message: 'motion-plan.json must state the visual concept and movement principle.',
        file: motionPlanPath,
        relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
      });
    }
    if (plan.shots.length === 0) {
      issues.push({
        severity: 'error',
        code: 'MOTION_SHOTS_EMPTY',
        message: 'motion-plan.json has no authored shots.',
        file: motionPlanPath,
        relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
      });
    }
    const seenShotIds = new Set<string>();
    for (const [index, shot] of plan.shots.entries()) {
      if (seenShotIds.has(shot.id)) {
        issues.push({
          severity: 'error',
          code: 'SHOT_ID_DUPLICATE',
          message: `shots[${index}].id duplicates “${shot.id}”.`,
          file: motionPlanPath,
          relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
        });
      }
      seenShotIds.add(shot.id);
      const next = plan.shots[index + 1];
      if (!next) {
        if (shot.boundaryToNext) {
          issues.push({
            severity: 'warning',
            code: 'FINAL_SHOT_BOUNDARY_UNUSED',
            message: `Final shot “${shot.id}” declares boundaryToNext but has no following shot.`,
            file: motionPlanPath,
            relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
          });
        }
        continue;
      }
      if (!shot.boundaryToNext) {
        issues.push({
          severity: 'error',
          code: 'SHOT_BOUNDARY_UNDECLARED',
          message: `Shot “${shot.id}” must declare boundaryToNext before “${next.id}”.`,
          file: motionPlanPath,
          relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
          suggestion: 'Choose continuous, motivated-cut, or intentional-stop and explain the boundary intent.',
        });
      }
      if (next.start < shot.start) {
        issues.push({
          severity: 'error',
          code: 'SHOT_ORDER_INVALID',
          message: `Shot “${next.id}” starts before the preceding shot “${shot.id}”.`,
          file: motionPlanPath,
          relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
        });
      }
      const gap = next.start - shot.end;
      if (gap > 0.05 && shot.boundaryToNext?.mode !== 'intentional-stop') {
        issues.push({
          severity: 'error',
          code: 'SHOT_GAP_UNEXPLAINED',
          message: `${gap.toFixed(3)}s is unassigned between “${shot.id}” and “${next.id}”.`,
          file: motionPlanPath,
          relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
          suggestion: 'Close or overlap the shots, or declare an intentional-stop boundary with a reason.',
        });
      }
    }
    if (plan.reviewMoments.filter((moment) => moment.kind === 'settle').length === 0) {
      issues.push({
        severity: 'warning',
        code: 'REVIEW_SETTLES_EMPTY',
        message: 'No settled animation moments are declared for exact-frame review.',
        file: motionPlanPath,
        relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
        suggestion: 'Add the end of every entrance, overshoot, phrase change, camera arrival, and CTA settle.',
      });
    }
    const duration = Math.max(0, ...plan.shots.map((shot) => shot.end));
    const invalidMoment = plan.reviewMoments.find((moment) => duration > 0 && moment.time > duration);
    if (invalidMoment) {
      issues.push({
        severity: 'error',
        code: 'REVIEW_MOMENT_OUTSIDE_TIMELINE',
        message: `Review moment “${invalidMoment.label}” at ${invalidMoment.time}s exceeds the authored ${duration}s timeline.`,
        file: motionPlanPath,
        relativeFile: motionPlanPath.split(/[\\/]/).at(-1),
      });
    }
  }

  return {
    plan,
    validation: {
      valid: !issues.some((issue) => issue.severity === 'error'),
      motionPlanPath,
      durationSeconds: plan ? Math.max(0, ...plan.shots.map((shot) => shot.end)) : undefined,
      shotCount: plan?.shots.length ?? 0,
      issues,
      authoringGuide: motionPlanAuthoringGuide,
    },
  };
}

export async function validateMotionPlan(path: string): Promise<MotionPlanValidation> {
  return (await inspectMotionPlan(path)).validation;
}

async function authoredSources(projectFile: string): Promise<Array<{ path: string; source: string }>> {
  const root = dirname(projectFile);
  const ignored = new Set([
    'ambient.ts',
    'camera.ts',
    'captions.tsx',
    'format.tsx',
    'kinetic.ts',
    'liquid-glass-text.tsx',
    'motion-library.tsx',
    'optical-glass.tsx',
    'paint.ts',
    'procedural.tsx',
    'review.tsx',
    'scene-tree.ts',
    'three-effects.ts',
    'transitions.ts',
    'vector-motion.ts',
  ]);
  const sources: Array<{ path: string; source: string }> = [];
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'public') continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile() && ['.ts', '.tsx'].includes(extname(entry.name)) && !ignored.has(entry.name) && path !== projectFile) {
        sources.push({ path, source: await readFile(path, 'utf8') });
      }
    }
  };
  await visit(root);
  return sources;
}

function lineAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

export async function lintAdvancedVideoQuality(
  projectFileInput: string,
  motionPlanPathInput?: string,
): Promise<AdvancedQualityLint> {
  const projectFile = resolve(projectFileInput);
  const root = dirname(projectFile);
  const motionPlanPath = resolve(motionPlanPathInput ?? join(root, 'motion-plan.json'));
  const inspectedPlan = await inspectMotionPlan(motionPlanPath);
  const plan = inspectedPlan.plan;
  const issues: QualityLintIssue[] = inspectedPlan.validation.issues.map((issue) => ({
    ...issue,
    relativeFile: issue.file ? relative(root, issue.file) : issue.relativeFile,
  }));

  const sources = await authoredSources(projectFile);
  let reviewRegistryUsed = false;
  const fullyIntentionalTimeline = plan?.shots.length
    ? plan.shots.every((shot) => shot.motionIntent === 'intentional-stillness')
    : false;
  for (const { path, source } of sources) {
    const relativeFile = relative(root, path);
    reviewRegistryUsed ||= /createReviewRegistry\s*\(/.test(source)
      && /\.register\s*\(/.test(source)
      && /ReviewOverlay/.test(source);

    for (const match of source.matchAll(/\bwaitFor\s*\(\s*([0-9]+(?:\.[0-9]+)?)\s*\)/g)) {
      const duration = Number(match[1]);
      if (duration < 0.5 || match.index === undefined || fullyIntentionalTimeline) continue;
      issues.push({
        severity: 'warning',
        code: 'UNEXPLAINED_LONG_WAIT',
        message: `waitFor(${duration}) can stop focal momentum even when background pixels continue moving.`,
        file: path,
        relativeFile,
        line: lineAt(source, match.index),
        suggestion: 'Keep the subject or camera alive across the interval, or declare the interval in motion-plan.json intentionalStillness.',
      });
    }

    for (const match of source.matchAll(/\bcameraPath\s*\(/g)) {
      if (match.index === undefined) continue;
      issues.push({
        severity: 'info',
        code: 'SEGMENTED_CAMERA_PATH',
        message: 'cameraPath eases every segment to zero velocity.',
        file: path,
        relativeFile,
        line: lineAt(source, match.index),
        suggestion: 'Use continuousCameraPath when the shot must preserve momentum through multiple beats.',
      });
    }
  }

  if (!reviewRegistryUsed) {
    issues.push({
      severity: 'warning',
      code: 'REVIEW_REGISTRY_MISSING',
      message: 'No registered critical elements and ReviewOverlay were found in authored scene sources.',
      suggestion: 'Register text fragments, logos, CTAs, and focal product regions so the audit render can expose overflow, collision, and centering candidates with source labels.',
    });
  }

  return {
    passed: !issues.some((issue) => issue.severity === 'error'),
    projectFile,
    motionPlanPath,
    issues,
  };
}
