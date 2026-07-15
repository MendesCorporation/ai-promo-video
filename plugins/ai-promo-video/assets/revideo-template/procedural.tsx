/** @jsxImportSource @revideo/2d/lib */
import {Circle, Layout, Line} from '@revideo/2d';
import {Reference, all, easeInOutCubic, easeOutCubic, sequence} from '@revideo/core';
import {createNoise2D} from 'simplex-noise';
import type {Point} from './motion-library';

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

export interface FlowFieldProps {
  width?: number;
  height?: number;
  count?: number;
  steps?: number;
  seed?: number;
  noiseScale?: number;
  stepLength?: number;
  color?: string;
  opacity?: number;
  lineWidth?: number;
  ref?: Reference<Layout>;
}

/** Deterministic flow lines for atmospheric fields, reveals, and particle paths. */
export function FlowField({width = 1920, height = 1080, count = 34, steps = 34, seed = 1, noiseScale = 0.0028, stepLength = 18, color = '#ffffff', opacity = 0.18, lineWidth = 2, ref}: FlowFieldProps) {
  const random = mulberry32(seed);
  const noise = createNoise2D(random);
  const lines = Array.from({length: count}, () => {
    let x = (random() - 0.5) * width;
    let y = (random() - 0.5) * height;
    const points: Point[] = [[x, y]];
    for (let step = 0; step < steps; step += 1) {
      const angle = noise(x * noiseScale, y * noiseScale) * Math.PI * 2.2;
      x += Math.cos(angle) * stepLength;
      y += Math.sin(angle) * stepLength;
      points.push([x, y]);
    }
    return points;
  });
  return <Layout ref={ref} width={width} height={height} clip>{lines.map((points, index) => <Line points={points} stroke={color} opacity={opacity * (0.55 + index % 5 * 0.1)} lineWidth={lineWidth} lineCap={'round'} />)}</Layout>;
}

export interface AttractorParticlesProps {
  points: Point[];
  refs: Array<Reference<Circle>>;
  palette?: string[];
  minSize?: number;
  maxSize?: number;
  seed?: number;
  ref?: Reference<Layout>;
}

export function AttractorParticles({points, refs, palette = ['#ffffff'], minSize = 4, maxSize = 13, seed = 1, ref}: AttractorParticlesProps) {
  if (refs.length < points.length) throw new Error('AttractorParticles requires one reference per point');
  const random = mulberry32(seed);
  return <Layout ref={ref}>{points.map((point, index) => <Circle ref={refs[index]} position={point} size={minSize + random() * (maxSize - minSize)} fill={palette[index % palette.length]} />)}</Layout>;
}

export function attractParticles(refs: Array<Reference<Circle>>, targets: Point[], duration = 1, stagger = 0.015) {
  if (refs.length < targets.length) throw new Error('attractParticles requires one reference per target');
  return sequence(stagger, ...targets.map((target, index) => all(
    refs[index]().position(target, duration, easeInOutCubic),
    refs[index]().opacity(1, duration * 0.45, easeOutCubic),
    refs[index]().scale(1, duration, easeOutCubic),
  )));
}

export function dissolveParticles(refs: Array<Reference<Circle>>, vectors: Point[], duration = 0.8, stagger = 0.01) {
  return sequence(stagger, ...refs.map((ref, index) => {
    const origin = ref().position();
    const vector = vectors[index % vectors.length] ?? [0, -120];
    return all(
      ref().position([origin.x + vector[0], origin.y + vector[1]], duration, easeOutCubic),
      ref().opacity(0, duration * 0.82, easeOutCubic),
      ref().scale(0.3, duration, easeOutCubic),
    );
  }));
}

export interface ShockwaveProps {
  color?: string;
  size?: number;
  ref?: Reference<Circle>;
}

export function Shockwave({color = '#ffffff', size = 40, ref}: ShockwaveProps) {
  return <Circle ref={ref} size={size} stroke={color} lineWidth={4} opacity={0} shadowColor={color} shadowBlur={28} />;
}

export function shockwave(ref: Reference<Circle>, duration = 0.72, scale = 14) {
  ref().opacity(0.9);
  ref().scale(0.25);
  return all(ref().scale(scale, duration, easeOutCubic), ref().opacity(0, duration, easeOutCubic), ref().lineWidth(0.5, duration, easeOutCubic));
}
