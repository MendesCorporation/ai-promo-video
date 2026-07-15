import {Gradient, Txt, blur} from '@revideo/2d';
import {
  Color,
  Reference,
  all,
  delay,
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

/** Prepare the hidden state before this text or any visible parent is revealed. */
export function prepareTrackReveal(ref: Reference<Txt>, options: TrackRevealOptions = {}) {
  const node = ref();
  node.opacity(0);
  node.scale(options.fromScale ?? 0.9);
  node.letterSpacing(options.fromTracking ?? 26);
  node.filters([blur(options.blur ?? 9)]);
}

/** Play a tracking reveal that has already been prepared off screen. */
export function playTrackReveal(ref: Reference<Txt>, options: TrackRevealOptions = {}) {
  const node = ref();
  const duration = options.duration ?? 0.7;
  return all(
    node.opacity(1, duration * 0.62, easeOutCubic),
    node.scale(1, duration, easeOutBack),
    node.letterSpacing(options.toTracking ?? 0, duration, easeOutCubic),
    node.filters.blur(0, duration, easeOutCubic),
  );
}

/**
 * Prepare and immediately play a tracking reveal. Safe at the start of a scene;
 * for delayed reveals, call prepareTrackReveal before the parent becomes visible
 * and playTrackReveal at the authored cue.
 */
export function trackReveal(ref: Reference<Txt>, options: TrackRevealOptions = {}) {
  prepareTrackReveal(ref, options);
  return playTrackReveal(ref, options);
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
  const colors = options.colors ?? ['#ffffff', '#a3a3a3', '#ffffff'];
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

export interface SpecularTextSweepOptions {
  /** Direction of travel through the glyphs. */
  direction?: 1 | -1;
  /** Gradient-axis angle in degrees. */
  angle?: number;
  /** Distance from the hidden start to hidden end in local text coordinates. */
  travel?: number;
  /** Length of each gradient along its axis. */
  span?: number;
  softColor?: string;
  coreColor?: string;
  softOpacity?: number;
  coreOpacity?: number;
  softWidth?: number;
  coreWidth?: number;
  softGlow?: number;
  coreGlow?: number;
  coreDelay?: number;
  fadeDuration?: number;
}

function alphaColor(value: string, alpha: number): string {
  const color = new Color(value);
  return new Color({r: color.r * 255, g: color.g * 255, b: color.b * 255, a: alpha}).serialize();
}

function specularStops(color: string, opacity: number, width: number) {
  const band = Math.min(0.46, Math.max(0.006, width));
  return [
    {offset: 0, color: alphaColor(color, 0)},
    {offset: 0.5 - band, color: alphaColor(color, 0)},
    {offset: 0.5, color: alphaColor(color, opacity)},
    {offset: 0.5 + band, color: alphaColor(color, 0)},
    {offset: 1, color: alphaColor(color, 0)},
  ];
}

/**
 * Pass a broad reflection and a crisp light core across prepared text layers.
 * Create the base and both overlays with SpecularTextStack at scene setup so
 * browsers never relayout dynamically inserted glyphs on the first light frame.
 */
export function* specularTextSweep(softRef: Reference<Txt>, coreRef: Reference<Txt>, duration = 1.5, options: SpecularTextSweepOptions = {}) {
  const soft = softRef();
  const core = coreRef();
  const size = soft.size();
  const direction = options.direction ?? 1;
  const angle = (options.angle ?? 52) * Math.PI / 180;
  const axis: [number, number] = [Math.cos(angle) * direction, Math.sin(angle) * direction];
  const travel = options.travel ?? Math.max(size.x, size.y) * 1.3;
  const span = options.span ?? Math.max(size.x, size.y) * 0.72;
  const startCenter: [number, number] = [-axis[0] * travel, -axis[1] * travel];
  const endCenter: [number, number] = [axis[0] * travel, axis[1] * travel];
  const endpoints = (center: [number, number]) => ({
    from: [center[0] - axis[0] * span / 2, center[1] - axis[1] * span / 2] as [number, number],
    to: [center[0] + axis[0] * span / 2, center[1] + axis[1] * span / 2] as [number, number],
  });
  const start = endpoints(startCenter);
  const end = endpoints(endCenter);
  const softColor = options.softColor ?? '#ffd49a';
  const coreColor = options.coreColor ?? '#fff8e8';
  const softGradient = new Gradient({
    type: 'linear',
    from: start.from,
    to: start.to,
    stops: specularStops(softColor, options.softOpacity ?? 0.46, options.softWidth ?? 0.18),
  });
  const coreGradient = new Gradient({
    type: 'linear',
    from: start.from,
    to: start.to,
    stops: specularStops(coreColor, options.coreOpacity ?? 0.96, options.coreWidth ?? 0.025),
  });
  soft.fill(softGradient);
  soft.shadowColor(alphaColor(softColor, options.softOpacity ?? 0.46));
  soft.shadowBlur(options.softGlow ?? 28);
  core.fill(coreGradient);
  core.shadowColor(alphaColor(coreColor, options.coreOpacity ?? 0.96));
  core.shadowBlur(options.coreGlow ?? 10);
  soft.opacity(1);
  core.opacity(1);

  const coreDelay = Math.max(0, Math.min(duration * 0.4, options.coreDelay ?? 0.05));
  yield* all(
    softGradient.from(end.from, duration, easeInOutCubic),
    softGradient.to(end.to, duration, easeInOutCubic),
    delay(coreDelay, all(
      coreGradient.from(end.from, Math.max(0.01, duration - coreDelay), easeInOutCubic),
      coreGradient.to(end.to, Math.max(0.01, duration - coreDelay), easeInOutCubic),
    )),
  );
  const fadeDuration = options.fadeDuration ?? 0.18;
  yield* all(
    soft.opacity(0, fadeDuration, easeOutCubic),
    core.opacity(0, fadeDuration, easeOutCubic),
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
