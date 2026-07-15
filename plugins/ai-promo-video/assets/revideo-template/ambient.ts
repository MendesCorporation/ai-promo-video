import type {Gradient, Node} from '@revideo/2d';
import {Reference, ThreadGenerator, all, tween} from '@revideo/core';

export type AmbientPoint = [number, number];

const TAU = Math.PI * 2;

function phaseFromSeed(seed: number, channel: number): number {
  const value = Math.sin((seed + channel * 101.31) * 12.9898) * 43758.5453;
  return (value - Math.floor(value)) * TAU;
}

function harmonic(seconds: number, speed: number, phase: number): number {
  return Math.sin(seconds * TAU * speed + phase)
    + Math.sin(seconds * TAU * speed * 0.47 + phase * 1.73) * 0.32;
}

function relativeHarmonic(seconds: number, speed: number, phase: number): number {
  return harmonic(seconds, speed, phase) - harmonic(0, speed, phase);
}

function envelope(progress: number, settle: boolean): number {
  return settle ? Math.sin(Math.PI * progress) : 1;
}

export interface AmbientDriftOptions {
  amplitude?: AmbientPoint;
  scaleAmplitude?: number;
  rotationAmplitude?: number;
  speed?: number;
  seed?: number;
  phase?: number;
  settle?: boolean;
}

/**
 * Keep one visual layer breathing for the full authored shot duration.
 * If the story also animates position, scale, or rotation, give ambient motion
 * a nested rig so concurrent threads never write to the same node signals.
 */
export function* ambientDrift(ref: Reference<Node>, duration: number, options: AmbientDriftOptions = {}) {
  const node = ref();
  const origin = node.position();
  const scale = node.scale();
  const rotation = node.rotation();
  const amplitude = options.amplitude ?? [18, 12];
  const scaleAmplitude = options.scaleAmplitude ?? 0.012;
  const rotationAmplitude = options.rotationAmplitude ?? 0.35;
  const speed = options.speed ?? 0.08;
  const seed = options.seed ?? 1;
  const phase = options.phase ?? phaseFromSeed(seed, 0);
  const phaseY = phaseFromSeed(seed, 1);
  const phaseScale = phaseFromSeed(seed, 2);
  const phaseRotation = phaseFromSeed(seed, 3);

  yield* tween(duration, (progress) => {
    const seconds = progress * duration;
    const weight = envelope(progress, options.settle ?? false);
    const x = relativeHarmonic(seconds, speed, phase) * amplitude[0] * weight;
    const y = relativeHarmonic(seconds, speed * 0.73, phaseY) * amplitude[1] * weight;
    const breathing = relativeHarmonic(seconds, speed * 0.61, phaseScale) * scaleAmplitude * weight;
    const turn = relativeHarmonic(seconds, speed * 0.83, phaseRotation) * rotationAmplitude * weight;
    node.position([origin.x + x, origin.y + y]);
    node.scale([scale.x * Math.max(0.05, 1 + breathing), scale.y * Math.max(0.05, 1 + breathing)]);
    node.rotation(rotation + turn);
  });
}

export interface AmbientCameraOptions extends AmbientDriftOptions {
  travel?: AmbientPoint;
  zoom?: number;
  roll?: number;
}

/** A restrained continuous camera move with no frozen hold between story beats. */
export function ambientCamera(ref: Reference<Node>, duration: number, options: AmbientCameraOptions = {}) {
  return ambientDrift(ref, duration, {
    amplitude: options.travel ?? options.amplitude ?? [30, 18],
    scaleAmplitude: options.zoom ?? options.scaleAmplitude ?? 0.018,
    rotationAmplitude: options.roll ?? options.rotationAmplitude ?? 0.28,
    speed: options.speed ?? 0.055,
    seed: options.seed ?? 11,
    phase: options.phase,
    settle: options.settle,
  });
}

export interface AmbientParallaxOptions {
  depths?: number[];
  travel?: AmbientPoint;
  scaleAmplitude?: number;
  speed?: number;
  seed?: number;
  settle?: boolean;
}

/** Move depth layers coherently while preserving their authored separation. */
export function* ambientParallax(refs: Array<Reference<Node>>, duration: number, options: AmbientParallaxOptions = {}) {
  const origins = refs.map((ref) => ref().position());
  const scales = refs.map((ref) => ref().scale());
  const depths = refs.map((_, index) => options.depths?.[index] ?? (index + 1) / Math.max(1, refs.length));
  const travel = options.travel ?? [44, 24];
  const speed = options.speed ?? 0.06;
  const seed = options.seed ?? 21;
  const phaseX = phaseFromSeed(seed, 0);
  const phaseY = phaseFromSeed(seed, 1);

  yield* tween(duration, (progress) => {
    const seconds = progress * duration;
    const weight = envelope(progress, options.settle ?? false);
    const x = relativeHarmonic(seconds, speed, phaseX) * travel[0] * weight;
    const y = relativeHarmonic(seconds, speed * 0.71, phaseY) * travel[1] * weight;
    refs.forEach((ref, index) => {
      const depth = depths[index];
      const breathing = 1 + relativeHarmonic(seconds, speed * 0.53, phaseFromSeed(seed, index + 3))
        * (options.scaleAmplitude ?? 0.008) * depth * weight;
      ref().position([origins[index].x + x * depth, origins[index].y + y * depth]);
      ref().scale([scales[index].x * breathing, scales[index].y * breathing]);
    });
  });
}

export interface AmbientOrbitOptions {
  radius?: AmbientPoint;
  speed?: number;
  rotationSpeed?: number;
  direction?: 1 | -1;
  phase?: number;
  seed?: number;
}

/** Orbit a decoration continuously without linear robotic travel. */
export function* ambientOrbit(ref: Reference<Node>, duration: number, options: AmbientOrbitOptions = {}) {
  const node = ref();
  const origin = node.position();
  const rotation = node.rotation();
  const radius = options.radius ?? [22, 14];
  const speed = options.speed ?? 0.07;
  const direction = options.direction ?? 1;
  const phase = options.phase ?? phaseFromSeed(options.seed ?? 31, 0);
  const startX = Math.cos(phase);
  const startY = Math.sin(phase);

  yield* tween(duration, (progress) => {
    const seconds = progress * duration;
    const angle = phase + seconds * TAU * speed * direction;
    node.position([
      origin.x + (Math.cos(angle) - startX) * radius[0],
      origin.y + (Math.sin(angle) - startY) * radius[1],
    ]);
    node.rotation(rotation + seconds * (options.rotationSpeed ?? 3) * direction);
  });
}

export interface AmbientPulseOptions {
  scaleAmplitude?: number;
  opacityAmplitude?: number;
  speed?: number;
  phase?: number;
}

/** Pulse light or emphasis smoothly; the default wave starts without a jump. */
export function* ambientPulse(ref: Reference<Node>, duration: number, options: AmbientPulseOptions = {}) {
  const node = ref();
  const scale = node.scale();
  const opacity = node.opacity();
  const speed = options.speed ?? 0.18;
  const phase = options.phase ?? 0;
  const initial = Math.sin(phase);
  yield* tween(duration, (progress) => {
    const seconds = progress * duration;
    const wave = Math.sin(seconds * TAU * speed + phase) - initial;
    const factor = Math.max(0.05, 1 + wave * (options.scaleAmplitude ?? 0.018));
    node.scale([scale.x * factor, scale.y * factor]);
    node.opacity(Math.max(0, Math.min(1, opacity + wave * (options.opacityAmplitude ?? 0.08))));
  });
}

export interface AmbientGradientOptions {
  travel?: AmbientPoint;
  speed?: number;
  seed?: number;
  settle?: boolean;
}

/** Drift a linear or radial gradient continuously without rebuilding its stops. */
export function* ambientGradient(gradient: Gradient, duration: number, options: AmbientGradientOptions = {}) {
  const from = gradient.from();
  const to = gradient.to();
  const travel = options.travel ?? [70, 42];
  const speed = options.speed ?? 0.06;
  const seed = options.seed ?? 41;
  const phaseX = phaseFromSeed(seed, 0);
  const phaseY = phaseFromSeed(seed, 1);
  yield* tween(duration, (progress) => {
    const seconds = progress * duration;
    const weight = envelope(progress, options.settle ?? false);
    const x = relativeHarmonic(seconds, speed, phaseX) * travel[0] * weight;
    const y = relativeHarmonic(seconds, speed * 0.79, phaseY) * travel[1] * weight;
    gradient.from([from.x + x, from.y + y]);
    gradient.to([to.x + x, to.y + y]);
  });
}

/**
 * Run the authored beat timeline and every ambient layer concurrently.
 * Narrative and ambient threads must own separate node signals; use nested
 * pose/ambient rigs when both kinds of motion affect one visual object.
 */
export function runWithAmbientMotion(main: ThreadGenerator, ...ambient: ThreadGenerator[]) {
  return all(main, ...ambient);
}
