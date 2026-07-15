/** @jsxImportSource @revideo/2d/lib */
import {Circle, Gradient, Layout, Line, Path, Rect, Txt, blur} from '@revideo/2d';
import type {TxtProps} from '@revideo/2d';
import {Reference, all, easeInOutCubic, easeOutBack, easeOutCubic, sequence} from '@revideo/core';

export type Point = [number, number];

function random(seed: number): () => number {
  let value = Math.max(1, Math.floor(seed)) % 2147483647;
  return () => {
    value = value * 16807 % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export interface AuroraBackdropProps {
  width?: number;
  height?: number;
  palette?: string[];
  opacity?: number;
  ref?: Reference<Rect>;
}

/** A neutral, recolorable field. Animate the returned Rect or its children for drift. */
export function AuroraBackdrop({width = 1920, height = 1080, palette = ['#ffffff', '#8f8f8f', '#d7d7d7'], opacity = 0.38, ref}: AuroraBackdropProps) {
  const positions: Point[] = [[-0.36 * width, -0.28 * height], [0.3 * width, -0.18 * height], [0.08 * width, 0.36 * height]];
  return (
    <Rect ref={ref} width={width} height={height} fill={'#000000'} clip>
      {positions.map((position, index) => (
        <Circle
          position={position}
          size={Math.max(width, height) * (0.66 - index * 0.08)}
          fill={`${palette[index % palette.length]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`}
          filters={[blur(110 + index * 28)]}
        />
      ))}
    </Rect>
  );
}

export interface SpotlightBackdropProps {
  width?: number;
  height?: number;
  color?: string;
  center?: Point;
  spread?: number;
  ref?: Reference<Rect>;
}

export function SpotlightBackdrop({width = 1920, height = 1080, color = '#ffffff', center = [0, 0], spread = 0.72, ref}: SpotlightBackdropProps) {
  const radius = Math.max(width, height) * spread;
  return (
    <Rect ref={ref} width={width} height={height} fill={'#000000'}>
      <Circle position={center} size={radius} fill={`${color}20`} filters={[blur(radius * 0.23)]} />
      <Circle position={center} size={radius * 0.42} fill={`${color}13`} filters={[blur(radius * 0.15)]} />
    </Rect>
  );
}

export interface PerspectiveGridProps {
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  columns?: number;
  rows?: number;
  horizonY?: number;
  ref?: Reference<Rect>;
}

export function PerspectiveGrid({width = 1920, height = 1080, color = '#ffffff', opacity = 0.16, columns = 13, rows = 10, horizonY = -120, ref}: PerspectiveGridProps) {
  const top = horizonY;
  const bottom = height / 2 + 120;
  return (
    <Rect ref={ref} width={width} height={height} clip opacity={opacity}>
      {Array.from({length: columns}, (_, index) => {
        const bottomX = -width * 0.72 + index * (width * 1.44 / Math.max(1, columns - 1));
        const topX = bottomX * 0.16;
        return <Line points={[[topX, top], [bottomX, bottom]]} stroke={color} lineWidth={2} />;
      })}
      {Array.from({length: rows}, (_, index) => {
        const progress = index / Math.max(1, rows - 1);
        const eased = progress * progress;
        const y = top + eased * (bottom - top);
        const halfWidth = width * (0.08 + eased * 0.64);
        return <Line points={[[-halfWidth, y], [halfWidth, y]]} stroke={color} lineWidth={2} />;
      })}
    </Rect>
  );
}

export interface OrbitRingsProps {
  rings?: number;
  radius?: number;
  color?: string;
  accent?: string;
  ref?: Reference<Rect>;
}

export function OrbitRings({rings = 4, radius = 360, color = '#ffffff', accent = '#ffffff', ref}: OrbitRingsProps) {
  return (
    <Rect ref={ref} size={radius * 2.5}>
      {Array.from({length: rings}, (_, index) => {
        const size = radius * 2 * ((index + 1) / rings);
        return <Circle size={size} stroke={`${color}24`} lineWidth={2} />;
      })}
      <Circle x={radius * 0.62} y={-radius * 0.2} size={18} fill={accent} shadowColor={accent} shadowBlur={25} />
      <Circle x={-radius * 0.32} y={radius * 0.48} size={10} fill={accent} opacity={0.7} />
    </Rect>
  );
}

export interface ParticleFieldProps {
  width?: number;
  height?: number;
  count?: number;
  seed?: number;
  palette?: string[];
  minSize?: number;
  maxSize?: number;
  opacity?: number;
  ref?: Reference<Rect>;
}

/** Deterministic by design: change seed to change the art direction without render flicker. */
export function ParticleField({width = 1920, height = 1080, count = 46, seed = 1, palette = ['#ffffff'], minSize = 3, maxSize = 14, opacity = 0.55, ref}: ParticleFieldProps) {
  const next = random(seed);
  const points = Array.from({length: count}, () => ({
    x: (next() - 0.5) * width,
    y: (next() - 0.5) * height,
    size: minSize + next() * (maxSize - minSize),
    color: palette[Math.floor(next() * palette.length) % palette.length],
    alpha: opacity * (0.35 + next() * 0.65),
  }));
  return (
    <Rect ref={ref} width={width} height={height} clip>
      {points.map((point) => <Circle x={point.x} y={point.y} size={point.size} fill={point.color} opacity={point.alpha} />)}
    </Rect>
  );
}

export type SpecularTextStackProps = Omit<TxtProps, 'ref'> & {
  baseRef: Reference<Txt>;
  softRef: Reference<Txt>;
  coreRef: Reference<Txt>;
  ref?: Reference<Layout>;
};

/** Prebuild aligned base, reflection, and light-core glyph layers. */
export function SpecularTextStack({baseRef, softRef, coreRef, ref, fill = '#ffffff', ...props}: SpecularTextStackProps) {
  return (
    <Layout ref={ref}>
      <Txt {...props} ref={baseRef} fill={fill} />
      <Txt {...props} ref={softRef} fill={'#00000000'} opacity={0} shadowColor={'#00000000'} shadowBlur={0} />
      <Txt {...props} ref={coreRef} fill={'#00000000'} opacity={0} shadowColor={'#00000000'} shadowBlur={0} />
    </Layout>
  );
}

export interface ScanlineOverlayProps {
  width?: number;
  height?: number;
  spacing?: number;
  color?: string;
  opacity?: number;
  ref?: Reference<Rect>;
}

export function ScanlineOverlay({width = 1920, height = 1080, spacing = 7, color = '#ffffff', opacity = 0.045, ref}: ScanlineOverlayProps) {
  const rows = Math.ceil(height / spacing);
  return (
    <Rect ref={ref} width={width} height={height} clip opacity={opacity}>
      {Array.from({length: rows}, (_, index) => <Line points={[[-width / 2, -height / 2 + index * spacing], [width / 2, -height / 2 + index * spacing]]} stroke={color} lineWidth={1} />)}
    </Rect>
  );
}

export interface GlassCardProps {
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  shadow?: string;
  children?: any;
  ref?: Reference<Rect>;
}

export function GlassCard({width = 520, height = 280, radius = 28, fill = '#ffffff12', stroke = '#ffffff24', shadow = '#00000066', children, ref}: GlassCardProps) {
  return <Rect ref={ref} width={width} height={height} radius={radius} fill={fill} stroke={stroke} lineWidth={2} shadowColor={shadow} shadowBlur={48}>{children}</Rect>;
}

export interface MetricTileProps {
  value: string;
  label: string;
  accent?: string;
  ref?: Reference<Rect>;
}

export function MetricTile({value, label, accent = '#ffffff', ref}: MetricTileProps) {
  return (
    <GlassCard ref={ref} width={420} height={220}>
      <Txt y={-25} text={value} fill={accent} fontFamily={'Inter, sans-serif'} fontSize={82} fontWeight={760} />
      <Txt y={66} text={label} fill={'#ffffffa8'} fontFamily={'Inter, sans-serif'} fontSize={26} />
    </GlassCard>
  );
}

export interface ProductFrameProps {
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  children?: any;
  ref?: Reference<Rect>;
}

export function ProductFrame({width = 1360, height = 760, radius = 28, fill = '#0d1018', stroke = '#ffffff24', children, ref}: ProductFrameProps) {
  return <Rect ref={ref} width={width} height={height} radius={radius} fill={fill} stroke={stroke} lineWidth={2} shadowColor={'#000000a8'} shadowBlur={80} clip>{children}</Rect>;
}

export interface BrowserFrameProps extends ProductFrameProps {
  url?: string;
  chromeHeight?: number;
}

export function BrowserFrame({width = 1360, height = 760, radius = 28, fill = '#0d1018', stroke = '#ffffff24', url = '', chromeHeight = 72, children, ref}: BrowserFrameProps) {
  return (
    <ProductFrame ref={ref} width={width} height={height} radius={radius} fill={fill} stroke={stroke}>
      <Rect width={width} height={chromeHeight} y={-height / 2 + chromeHeight / 2} fill={'#ffffff0b'}>
        {['#ff5f57', '#febc2e', '#28c840'].map((color, index) => <Circle x={-width / 2 + 34 + index * 30} size={13} fill={color} />)}
        {url ? <Rect width={Math.min(620, width * 0.48)} height={36} radius={18} fill={'#ffffff0b'}><Txt text={url} fill={'#ffffff70'} fontFamily={'Inter, sans-serif'} fontSize={17} /></Rect> : null}
      </Rect>
      <Rect y={chromeHeight / 2} width={width} height={height - chromeHeight}>{children}</Rect>
    </ProductFrame>
  );
}

export const CURSOR_PATH = 'M5 3v42l11-10 8 18 8-4-8-17h16L5 3Z';

export interface CursorGlyphProps {
  fill?: string;
  stroke?: string;
  scale?: number;
  ref?: Reference<Path>;
}

export function CursorGlyph({fill = '#ffffff', stroke = '#10131c', scale = 1, ref}: CursorGlyphProps) {
  return <Path ref={ref} data={CURSOR_PATH} fill={fill} stroke={stroke} lineWidth={3} scale={scale} shadowColor={'#00000080'} shadowBlur={16} />;
}

export interface ClickPulseProps {
  color?: string;
  size?: number;
  ref?: Reference<Circle>;
}

export function ClickPulse({color = '#ffffff', size = 34, ref}: ClickPulseProps) {
  return <Circle ref={ref} size={size} fill={`${color}18`} stroke={color} lineWidth={2} opacity={0} />;
}

export interface FocusRingProps {
  width?: number;
  height?: number;
  color?: string;
  radius?: number;
  ref?: Reference<Rect>;
}

export function FocusRing({width = 260, height = 120, color = '#ffffff', radius = 20, ref}: FocusRingProps) {
  return <Rect ref={ref} width={width} height={height} radius={radius} stroke={color} lineWidth={3} fill={`${color}08`} shadowColor={color} shadowBlur={28} />;
}

export interface RouteTraceProps {
  points: Point[];
  color?: string;
  width?: number;
  dashed?: boolean;
  ref?: Reference<Line>;
}

export function RouteTrace({points, color = '#ffffff', width = 4, dashed = false, ref}: RouteTraceProps) {
  return <Line ref={ref} points={points} stroke={color} lineWidth={width} lineCap={'round'} lineDash={dashed ? [12, 16] : []} end={0} />;
}

export interface CameraMoveOptions {
  position?: Point;
  scale?: number;
  rotation?: number;
  duration?: number;
}

/** Animate a scene group as a 2.5D camera. Combine with independently moving depth layers. */
export function cameraMove(ref: Reference<Rect>, options: CameraMoveOptions = {}) {
  const duration = options.duration ?? 1;
  const node = ref();
  return all(
    node.position(options.position ?? node.position(), duration, easeInOutCubic),
    node.scale(options.scale ?? node.scale(), duration, easeInOutCubic),
    node.rotation(options.rotation ?? node.rotation(), duration, easeInOutCubic),
  );
}

export interface StaggerInOptions {
  stagger?: number;
  duration?: number;
  offset?: Point;
  fromScale?: number;
}

/** Assemble authored nodes while preserving each node's final measured position. */
export function staggerIn(refs: Array<Reference<Rect>>, options: StaggerInOptions = {}) {
  const stagger = options.stagger ?? 0.08;
  const duration = options.duration ?? 0.58;
  const offset = options.offset ?? [0, 52];
  const targets = refs.map((ref) => ref().position());
  refs.forEach((ref, index) => {
    ref().opacity(0);
    ref().position([targets[index].x + offset[0], targets[index].y + offset[1]]);
    ref().scale(options.fromScale ?? 0.9);
    ref().filters([blur(7)]);
  });
  return sequence(stagger, ...refs.map((ref, index) => all(
    ref().opacity(1, duration * 0.55, easeOutCubic),
    ref().position(targets[index], duration, easeOutCubic),
    ref().scale(1, duration, easeOutBack),
    ref().filters.blur(0, duration, easeOutCubic),
  )));
}

export interface CursorClickOptions {
  duration?: number;
  clickScale?: number;
}

/** Synchronize cursor press and visual response at the already-authored click position. */
export function cursorClick(cursor: Reference<Path>, pulse: Reference<Circle>, options: CursorClickOptions = {}) {
  const duration = options.duration ?? 0.42;
  pulse().position(cursor().position());
  pulse().opacity(0);
  pulse().scale(0.5);
  return all(
    pulse().opacity(1, duration * 0.16).to(0, duration * 0.84, easeOutCubic),
    pulse().scale(options.clickScale ?? 3, duration, easeOutCubic),
    cursor().scale(0.82, duration * 0.18).to(1, duration * 0.32, easeOutBack),
  );
}
