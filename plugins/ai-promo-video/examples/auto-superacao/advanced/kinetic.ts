import {Gradient, Txt, blur} from '@revideo/2d';
import {
  Reference,
  all,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  sequence,
  tween,
} from '@revideo/core';

export interface TrackRevealOptions {
  duration?: number;
  fromTracking?: number;
  toTracking?: number;
  fromScale?: number;
  blur?: number;
}

/** Resolve tracking, scale, blur, and opacity as one designed text entrance. */
export function trackReveal(ref: Reference<Txt>, options: TrackRevealOptions = {}) {
  const node = ref();
  const duration = options.duration ?? 0.7;
  node.opacity(0);
  node.scale(options.fromScale ?? 0.9);
  node.letterSpacing(options.fromTracking ?? 26);
  node.filters([blur(options.blur ?? 9)]);
  return all(
    node.opacity(1, duration * 0.62, easeOutCubic),
    node.scale(1, duration, easeOutBack),
    node.letterSpacing(options.toTracking ?? 0, duration, easeOutCubic),
    node.filters.blur(0, duration, easeOutCubic),
  );
}

export interface WordCascadeOptions {
  stagger?: number;
  duration?: number;
  offset?: number;
  blur?: number;
  fromScale?: number;
}

/** Reveal independently positioned word nodes with controlled stagger. */
export function wordCascade(refs: Array<Reference<Txt>>, options: WordCascadeOptions = {}) {
  const stagger = options.stagger ?? 0.09;
  const duration = options.duration ?? 0.55;
  const offset = options.offset ?? 42;
  const targets = refs.map((ref) => ref().y());
  refs.forEach((ref, index) => {
    ref().opacity(0);
    ref().y(targets[index] + offset);
    ref().scale(options.fromScale ?? 0.86);
    ref().filters([blur(options.blur ?? 7)]);
  });
  return sequence(stagger, ...refs.map((ref, index) => all(
    ref().opacity(1, duration * 0.6, easeOutCubic),
    ref().y(targets[index], duration, easeOutCubic),
    ref().scale(1, duration, easeOutBack),
    ref().filters.blur(0, duration, easeOutCubic),
  )));
}

export interface ImpactTextOptions {
  duration?: number;
  fromScale?: number;
  rotation?: number;
  blur?: number;
}

/** Land a headline with scale, rotation, blur, and a controlled overshoot. */
export function impactText(ref: Reference<Txt>, options: ImpactTextOptions = {}) {
  const node = ref();
  const duration = options.duration ?? 0.62;
  node.opacity(0);
  node.scale(options.fromScale ?? 1.75);
  node.rotation(options.rotation ?? -3);
  node.filters([blur(options.blur ?? 14)]);
  return all(
    node.opacity(1, duration * 0.42, easeOutCubic),
    node.scale(1, duration, easeOutBack),
    node.rotation(0, duration, easeOutCubic),
    node.filters.blur(0, duration * 0.8, easeOutCubic),
  );
}

export interface LetterRiseOptions {
  stagger?: number;
  duration?: number;
  offset?: number;
  blur?: number;
  rotation?: number;
}

/** Raise separately authored letter nodes with per-character stagger. */
export function letterRise(refs: Array<Reference<Txt>>, options: LetterRiseOptions = {}) {
  const stagger = options.stagger ?? 0.035;
  const duration = options.duration ?? 0.5;
  const offset = options.offset ?? 70;
  const rotation = options.rotation ?? 5;
  const targets = refs.map((ref) => ref().y());
  refs.forEach((ref, index) => {
    ref().opacity(0);
    ref().y(targets[index] + offset);
    ref().rotation((index % 2 ? -1 : 1) * rotation);
    ref().filters([blur(options.blur ?? 7)]);
  });
  return sequence(stagger, ...refs.map((ref, index) => all(
    ref().opacity(1, duration * 0.55, easeOutCubic),
    ref().y(targets[index], duration, easeOutBack),
    ref().rotation(0, duration, easeOutCubic),
    ref().filters.blur(0, duration, easeOutCubic),
  )));
}

export interface GradientSweepOptions {
  colors?: string[];
  span?: number;
  direction?: 1 | -1;
}

/** Sweep a live gradient through text without rasterizing it. */
export function gradientSweep(ref: Reference<Txt>, duration: number, options: GradientSweepOptions = {}) {
  const colors = options.colors ?? ['#7c3aed', '#f472d0', '#58d7c4', '#7c3aed'];
  const span = options.span ?? 560;
  const direction = options.direction ?? 1;
  const start = -span * direction;
  const end = span * direction;
  const gradient = new Gradient({
    type: 'linear',
    from: [start, 0],
    to: [0, 0],
    stops: colors.map((color, index) => ({offset: index / Math.max(1, colors.length - 1), color})),
  });
  ref().fill(gradient);
  return all(
    gradient.from([0, 0], duration, easeInOutCubic),
    gradient.to([end, 0], duration, easeInOutCubic),
  );
}

export interface TypewriterOptions {
  cursor?: string;
  keepCursor?: boolean;
}

/** Type characters on frame boundaries so the effect is deterministic. */
export function* typewriter(ref: Reference<Txt>, text: string, duration: number, options: TypewriterOptions = {}) {
  const node = ref();
  const cursor = options.cursor ?? '│';
  node.opacity(1);
  node.text(cursor);
  let visible = -1;
  yield* tween(duration, (value) => {
    const next = Math.min(text.length, Math.floor(easeOutCubic(value) * (text.length + 1)));
    if (next === visible) return;
    visible = next;
    node.text(`${text.slice(0, next)}${next < text.length || options.keepCursor ? cursor : ''}`);
  });
  node.text(`${text}${options.keepCursor ? cursor : ''}`);
}

export interface EraseAndTypeOptions extends TypewriterOptions {
  eraseFraction?: number;
}

/** Delete the current phrase character-by-character, then write its replacement. */
export function* eraseAndType(ref: Reference<Txt>, next: string, duration: number, options: EraseAndTypeOptions = {}) {
  const node = ref();
  const cursor = options.cursor ?? '│';
  const currentText = node.text();
  const current = currentText.endsWith(cursor) ? currentText.slice(0, -cursor.length) : currentText;
  const eraseDuration = duration * (options.eraseFraction ?? 0.38);
  let remaining = current.length;
  yield* tween(eraseDuration, (value) => {
    const nextRemaining = Math.max(0, current.length - Math.floor(easeInCubic(value) * (current.length + 1)));
    if (nextRemaining === remaining) return;
    remaining = nextRemaining;
    node.text(`${current.slice(0, remaining)}${cursor}`);
  });
  node.text(cursor);
  yield* typewriter(ref, next, Math.max(0.01, duration - eraseDuration), options);
}

export interface SwapTextOptions {
  distance?: number;
  blur?: number;
  direction?: 1 | -1;
}

/** Replace a phrase through directional motion and blur rather than a dissolve. */
export function* swapText(ref: Reference<Txt>, next: string, duration: number, options: SwapTextOptions = {}) {
  const node = ref();
  const origin = node.x();
  const distance = options.distance ?? 90;
  const direction = options.direction ?? 1;
  const blurAmount = options.blur ?? 12;
  node.filters([blur(0)]);
  yield* all(
    node.opacity(0, duration * 0.42, easeInCubic),
    node.x(origin - distance * direction, duration * 0.42, easeInCubic),
    node.filters.blur(blurAmount, duration * 0.42, easeInCubic),
  );
  node.text(next);
  node.x(origin + distance * direction);
  yield* all(
    node.opacity(1, duration * 0.58, easeOutCubic),
    node.x(origin, duration * 0.58, easeOutCubic),
    node.filters.blur(0, duration * 0.58, easeOutCubic),
  );
}

export interface PushTextOptions {
  distance?: number;
  direction?: 1 | -1;
  axis?: 'x' | 'y';
  blur?: number;
}

/** Let an incoming phrase physically push an outgoing phrase off the frame. */
export function* pushText(outgoing: Reference<Txt>, incoming: Reference<Txt>, duration: number, options: PushTextOptions = {}) {
  const out = outgoing();
  const next = incoming();
  const axis = options.axis ?? 'x';
  const distance = (options.distance ?? 760) * (options.direction ?? 1);
  const blurAmount = options.blur ?? 6;
  const outOrigin = axis === 'x' ? out.x() : out.y();
  const nextOrigin = axis === 'x' ? next.x() : next.y();
  next.opacity(1);
  next.filters([blur(blurAmount)]);
  if (axis === 'x') next.x(nextOrigin + distance);
  else next.y(nextOrigin + distance);
  yield* all(
    axis === 'x' ? out.x(outOrigin - distance, duration, easeInOutCubic) : out.y(outOrigin - distance, duration, easeInOutCubic),
    axis === 'x' ? next.x(nextOrigin, duration, easeInOutCubic) : next.y(nextOrigin, duration, easeInOutCubic),
    out.opacity(0, duration * 0.82, easeInCubic),
    out.filters.blur(blurAmount, duration * 0.65, easeInCubic),
    next.filters.blur(0, duration * 0.72, easeOutCubic),
  );
}

export interface TextRowOptions {
  gap?: number;
  centerX?: number;
}

/** Position separate text nodes as one measured row instead of guessing x coordinates. */
export function arrangeTextRow(refs: Array<Reference<Txt>>, options: TextRowOptions = {}): number[] {
  const gap = options.gap ?? 40;
  const widths = refs.map((ref) => ref().size().x);
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, refs.length - 1);
  let cursor = (options.centerX ?? 0) - total / 2;
  return refs.map((ref, index) => {
    const x = cursor + widths[index] / 2;
    ref().x(x);
    cursor += widths[index] + gap;
    return x;
  });
}
