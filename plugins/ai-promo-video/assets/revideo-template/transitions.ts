import type {Node, Path} from '@revideo/2d';
import {
  Reference,
  all,
  delay,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  tween,
  waitFor,
} from '@revideo/core';
import {morphVectorPath} from './vector-motion';

export type TransitionPoint = [number, number];
export type TransitionBounds = {x: number; y: number; width: number; height: number};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}
function normalize(point: TransitionPoint): TransitionPoint {
  const length = Math.hypot(point[0], point[1]) || 1;
  return [point[0] / length, point[1] / length];
}

function position(node: Node): TransitionPoint {
  const value = node.position();
  return [value.x, value.y];
}

function scale(node: Node): TransitionPoint {
  const value = node.scale();
  return [value.x, value.y];
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function mixPoint(from: TransitionPoint, to: TransitionPoint, progress: number): TransitionPoint {
  return [mix(from[0], to[0], progress), mix(from[1], to[1], progress)];
}

function seeded(seed: number) {
  let state = Math.max(1, Math.floor(seed)) % 2147483647;
  return () => {
    state = state * 16807 % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export interface DirectionalPushOptions {
  direction?: TransitionPoint;
  distance?: number;
  overlap?: number;
  depth?: number;
  incomingOvershoot?: number;
}

/** Push two authored scene groups on one vector while separating their depth. */
export function* directionalPush(
  outgoingRef: Reference<Node>,
  incomingRef: Reference<Node>,
  duration = 0.9,
  options: DirectionalPushOptions = {},
) {
  const outgoing = outgoingRef();
  const incoming = incomingRef();
  const direction = normalize(options.direction ?? [-1, 0]);
  const distance = options.distance ?? 1320;
  const overlap = clamp(options.overlap ?? 0.28, 0.05, 0.8);
  const depth = clamp(options.depth ?? 0.07, 0, 0.3);
  const overshoot = Math.max(0, options.incomingOvershoot ?? 0.025);
  const outgoingOrigin = position(outgoing);
  const incomingTarget = position(incoming);
  const outgoingScale = scale(outgoing);
  const incomingScale = scale(incoming);
  const incomingDuration = duration * (0.55 + overlap * 0.45);
  const incomingDelay = Math.max(0, duration - incomingDuration);

  incoming.position([incomingTarget[0] - direction[0] * distance, incomingTarget[1] - direction[1] * distance]);
  incoming.scale([incomingScale[0] * (1 + depth + overshoot), incomingScale[1] * (1 + depth + overshoot)]);
  incoming.opacity(1);

  yield* all(
    outgoing.position([outgoingOrigin[0] + direction[0] * distance, outgoingOrigin[1] + direction[1] * distance], duration, easeInCubic),
    outgoing.scale([outgoingScale[0] * (1 - depth), outgoingScale[1] * (1 - depth)], duration, easeInCubic),
    outgoing.opacity(0, duration * 0.92, easeInCubic),
    delay(incomingDelay, all(
      incoming.position(incomingTarget, incomingDuration, easeOutCubic),
      incoming.scale(incomingScale, incomingDuration, easeOutBack),
    )),
  );
}

export interface ZoomThroughOptions {
  target?: TransitionPoint;
  zoom?: number;
  blur?: number;
  incomingScale?: number;
  overlap?: number;
  roll?: number;
}

/** Move through an authored portal/focal point and resolve into the next scene. */
export function* zoomThrough(
  outgoingRef: Reference<Node>,
  incomingRef: Reference<Node>,
  duration = 1.05,
  options: ZoomThroughOptions = {},
) {
  const outgoing = outgoingRef();
  const incoming = incomingRef();
  const target = options.target ?? [0, 0];
  const zoom = Math.max(1.2, options.zoom ?? 5.2);
  const blurAmount = Math.max(0, options.blur ?? 24);
  const overlap = clamp(options.overlap ?? 0.34, 0.1, 0.75);
  const outgoingOrigin = position(outgoing);
  const outgoingScale = scale(outgoing);
  const incomingTarget = position(incoming);
  const incomingTargetScale = scale(incoming);
  const incomingStartScale = Math.max(0.1, options.incomingScale ?? 0.72);
  const revealDuration = duration * (0.48 + overlap * 0.45);
  const revealDelay = duration - revealDuration;

  incoming.position(incomingTarget);
  incoming.scale([incomingTargetScale[0] * incomingStartScale, incomingTargetScale[1] * incomingStartScale]);
  incoming.opacity(0);
  incoming.filters.blur(blurAmount * 0.45);

  yield* all(
    outgoing.position([
      outgoingOrigin[0] - target[0] * (zoom - 1),
      outgoingOrigin[1] - target[1] * (zoom - 1),
    ], duration, easeInCubic),
    outgoing.scale([outgoingScale[0] * zoom, outgoingScale[1] * zoom], duration, easeInCubic),
    outgoing.rotation(outgoing.rotation() + (options.roll ?? -2.5), duration, easeInCubic),
    outgoing.filters.blur(blurAmount, duration * 0.82, easeInCubic),
    outgoing.opacity(0, duration * 0.94, easeInCubic),
    delay(revealDelay, all(
      incoming.opacity(1, revealDuration * 0.72, easeOutCubic),
      incoming.scale(incomingTargetScale, revealDuration, easeOutCubic),
      incoming.filters.blur(0, revealDuration * 0.8, easeOutCubic),
    )),
  );
}

export interface ShapeWipeOptions {
  origin?: TransitionPoint;
  coverScale?: number;
  rotation?: number;
  incomingScale?: number;
}

/** Cover the cut with any caller-authored shape, swap scenes under cover, then clear it. */
export function* shapeWipe(
  shapeRef: Reference<Node>,
  outgoingRef: Reference<Node>,
  incomingRef: Reference<Node>,
  duration = 0.9,
  options: ShapeWipeOptions = {},
) {
  const shape = shapeRef();
  const outgoing = outgoingRef();
  const incoming = incomingRef();
  const shapeTarget = position(shape);
  const shapeTargetScale = scale(shape);
  const incomingScale = scale(incoming);
  const coverDuration = duration * 0.54;
  const clearDuration = duration - coverDuration;

  shape.position(options.origin ?? shapeTarget);
  shape.scale([0.001, 0.001]);
  shape.opacity(1);
  incoming.opacity(0);
  incoming.scale([incomingScale[0] * (options.incomingScale ?? 1.035), incomingScale[1] * (options.incomingScale ?? 1.035)]);

  yield* all(
    shape.scale([
      shapeTargetScale[0] * (options.coverScale ?? 18),
      shapeTargetScale[1] * (options.coverScale ?? 18),
    ], coverDuration, easeInCubic),
    shape.rotation(shape.rotation() + (options.rotation ?? 28), coverDuration, easeInCubic),
    outgoing.scale([scale(outgoing)[0] * 0.96, scale(outgoing)[1] * 0.96], coverDuration, easeInCubic),
  );
  outgoing.opacity(0);
  incoming.opacity(1);
  yield* all(
    shape.opacity(0, clearDuration, easeOutCubic),
    shape.scale([shapeTargetScale[0] * 22, shapeTargetScale[1] * 22], clearDuration, easeOutCubic),
    incoming.scale(incomingScale, clearDuration, easeOutCubic),
  );
}

export interface ObjectCarryOptions {
  end: TransitionPoint;
  control?: TransitionPoint;
  endScale?: number | TransitionPoint;
  endRotation?: number;
  sceneOverlap?: number;
}

/** Carry one meaningful authored object along a curved bridge while the scenes exchange. */
export function* objectCarry(
  objectRef: Reference<Node>,
  outgoingRef: Reference<Node>,
  incomingRef: Reference<Node>,
  duration = 1.1,
  options: ObjectCarryOptions,
) {
  const object = objectRef();
  const outgoing = outgoingRef();
  const incoming = incomingRef();
  const start = position(object);
  const startScale = scale(object);
  const targetScale = typeof options.endScale === 'number'
    ? [options.endScale, options.endScale] as TransitionPoint
    : options.endScale ?? startScale;
  const startRotation = object.rotation();
  const endRotation = options.endRotation ?? startRotation;
  const control = options.control ?? [(start[0] + options.end[0]) / 2, Math.min(start[1], options.end[1]) - 180];
  const overlap = clamp(options.sceneOverlap ?? 0.42, 0.1, 0.8);
  incoming.opacity(0);

  yield* all(
    tween(duration, (raw) => {
      const progress = easeInOutCubic(raw);
      const inverse = 1 - progress;
      object.position([
        inverse * inverse * start[0] + 2 * inverse * progress * control[0] + progress * progress * options.end[0],
        inverse * inverse * start[1] + 2 * inverse * progress * control[1] + progress * progress * options.end[1],
      ]);
      object.scale(mixPoint(startScale, targetScale, easeOutBack(Math.min(1, raw))));
      object.rotation(mix(startRotation, endRotation, progress));
    }),
    outgoing.opacity(0, duration * (0.62 + overlap * 0.18), easeInCubic),
    delay(duration * (1 - overlap), incoming.opacity(1, duration * overlap, easeOutCubic)),
  );
}

export interface DirectionalBlurCutOptions {
  direction?: TransitionPoint;
  distance?: number;
  blur?: number;
  overlap?: number;
  echoDistance?: number;
}

/** Bridge a fast cut with real animated blur plus optional authored echo/trail clones. */
export function* directionalBlurCut(
  outgoingRef: Reference<Node>,
  incomingRef: Reference<Node>,
  duration = 0.42,
  options: DirectionalBlurCutOptions = {},
  echoRefs: Array<Reference<Node>> = [],
) {
  const outgoing = outgoingRef();
  const incoming = incomingRef();
  const direction = normalize(options.direction ?? [-1, 0]);
  const distance = options.distance ?? 360;
  const blurAmount = options.blur ?? 34;
  const overlap = clamp(options.overlap ?? 0.5, 0.2, 0.85);
  const outgoingOrigin = position(outgoing);
  const incomingTarget = position(incoming);
  const incomingDelay = duration * (1 - overlap);
  const incomingDuration = duration - incomingDelay;
  incoming.position([incomingTarget[0] - direction[0] * distance, incomingTarget[1] - direction[1] * distance]);
  incoming.opacity(0);
  incoming.filters.blur(blurAmount);

  echoRefs.forEach((ref, index) => {
    const echo = ref();
    echo.opacity(0.2 / (index + 1));
    echo.position(outgoingOrigin);
  });

  yield* all(
    outgoing.position([outgoingOrigin[0] + direction[0] * distance, outgoingOrigin[1] + direction[1] * distance], duration, easeInCubic),
    outgoing.filters.blur(blurAmount, duration * 0.55, easeInCubic),
    outgoing.opacity(0, duration * 0.82, easeInCubic),
    ...echoRefs.map((ref, index) => all(
      ref().position([
        outgoingOrigin[0] + direction[0] * (options.echoDistance ?? 520) * ((index + 1) / echoRefs.length),
        outgoingOrigin[1] + direction[1] * (options.echoDistance ?? 520) * ((index + 1) / echoRefs.length),
      ], duration, easeOutCubic),
      ref().opacity(0, duration, easeOutCubic),
    )),
    delay(incomingDelay, all(
      incoming.position(incomingTarget, incomingDuration, easeOutCubic),
      incoming.opacity(1, incomingDuration * 0.72, easeOutCubic),
      incoming.filters.blur(0, incomingDuration, easeOutCubic),
    )),
  );
}

export interface MatchScaleOptions {
  fromBounds: TransitionBounds;
  toBounds: TransitionBounds;
  endRotation?: number;
  overlap?: number;
}

function poseFromBounds(bounds: TransitionBounds): {position: TransitionPoint; scale: TransitionPoint} {
  return {position: [bounds.x, bounds.y], scale: [bounds.width, bounds.height]};
}

/** Animate a caller-authored bridge clone between measured source and destination bounds. */
export function* matchScale(
  bridgeRef: Reference<Node>,
  outgoingRef: Reference<Node>,
  incomingRef: Reference<Node>,
  duration = 0.9,
  options: MatchScaleOptions,
) {
  const bridge = bridgeRef();
  const outgoing = outgoingRef();
  const incoming = incomingRef();
  const from = poseFromBounds(options.fromBounds);
  const to = poseFromBounds(options.toBounds);
  const baseScale = scale(bridge);
  const startRotation = bridge.rotation();
  const overlap = clamp(options.overlap ?? 0.4, 0.1, 0.8);
  bridge.position(from.position);
  bridge.scale(baseScale);
  incoming.opacity(0);

  yield* all(
    tween(duration, (raw) => {
      const progress = easeInOutCubic(raw);
      bridge.position(mixPoint(from.position, to.position, progress));
      bridge.scale([
        baseScale[0] * mix(1, to.scale[0] / Math.max(1, from.scale[0]), progress),
        baseScale[1] * mix(1, to.scale[1] / Math.max(1, from.scale[1]), progress),
      ]);
      bridge.rotation(mix(startRotation, options.endRotation ?? startRotation, progress));
    }),
    outgoing.opacity(0, duration * 0.62, easeInCubic),
    delay(duration * (1 - overlap), incoming.opacity(1, duration * overlap, easeOutCubic)),
  );
}

export interface OrganicMorphWipeOptions {
  fromPath: string;
  toPath: string;
  coverScale?: number;
  rotation?: number;
  maxSegmentLength?: number;
}

/** Morph a caller-authored SVG silhouette into a full-frame cover and reveal the destination. */
export function* organicMorphWipe(
  pathRef: Reference<Path>,
  outgoingRef: Reference<Node>,
  incomingRef: Reference<Node>,
  duration = 1,
  options: OrganicMorphWipeOptions,
) {
  const path = pathRef();
  const outgoing = outgoingRef();
  const incoming = incomingRef();
  const baseScale = scale(path);
  const morphDuration = duration * 0.58;
  incoming.opacity(0);
  yield* all(
    morphVectorPath(pathRef, options.fromPath, options.toPath, morphDuration, options.maxSegmentLength ?? 8),
    path.scale([baseScale[0] * (options.coverScale ?? 10), baseScale[1] * (options.coverScale ?? 10)], morphDuration, easeInCubic),
    path.rotation(path.rotation() + (options.rotation ?? 18), morphDuration, easeInCubic),
    outgoing.scale([scale(outgoing)[0] * 0.96, scale(outgoing)[1] * 0.96], morphDuration, easeInCubic),
  );
  outgoing.opacity(0);
  incoming.opacity(1);
  yield* all(
    path.opacity(0, duration - morphDuration, easeOutCubic),
    incoming.scale(scale(incoming), duration - morphDuration, easeOutCubic),
  );
}

export interface SharedElementBridgeOptions extends MatchScaleOptions {
  arcDepth?: number;
  arcDirection?: 1 | -1;
}

/** Transform a shared clone between measured bounds with an authored z-arc and scene overlap. */
export function* sharedElementBridge(
  bridgeRef: Reference<Node>,
  outgoingRef: Reference<Node>,
  incomingRef: Reference<Node>,
  duration = 1.05,
  options: SharedElementBridgeOptions,
) {
  const bridge = bridgeRef();
  const outgoing = outgoingRef();
  const incoming = incomingRef();
  const from = poseFromBounds(options.fromBounds);
  const to = poseFromBounds(options.toBounds);
  const baseScale = scale(bridge);
  const startRotation = bridge.rotation();
  const overlap = clamp(options.overlap ?? 0.46, 0.1, 0.8);
  const arcDepth = options.arcDepth ?? 0.18;
  const arcDirection = options.arcDirection ?? 1;
  bridge.position(from.position);
  incoming.opacity(0);

  yield* all(
    tween(duration, (raw) => {
      const progress = easeInOutCubic(raw);
      const lift = Math.sin(Math.PI * progress) * arcDepth * arcDirection;
      bridge.position([
        mix(from.position[0], to.position[0], progress),
        mix(from.position[1], to.position[1], progress) - lift * Math.max(from.height, to.height),
      ]);
      const ratioX = to.width / Math.max(1, from.width);
      const ratioY = to.height / Math.max(1, from.height);
      const depthScale = 1 + Math.sin(Math.PI * progress) * Math.abs(arcDepth);
      bridge.scale([
        baseScale[0] * mix(1, ratioX, progress) * depthScale,
        baseScale[1] * mix(1, ratioY, progress) * depthScale,
      ]);
      bridge.rotation(mix(startRotation, options.endRotation ?? startRotation, progress));
    }),
    outgoing.opacity(0, duration * 0.68, easeInCubic),
    delay(duration * (1 - overlap), incoming.opacity(1, duration * overlap, easeOutCubic)),
  );
}

export interface WhipPanBridgeOptions {
  direction?: TransitionPoint;
  distance?: number;
  blur?: number;
  overshoot?: number;
  settle?: number;
}

/** Execute a fast directional camera carry with blur, overshoot, and a readable settle. */
export function* whipPanBridge(
  outgoingRef: Reference<Node>,
  incomingRef: Reference<Node>,
  duration = 0.62,
  options: WhipPanBridgeOptions = {},
) {
  const outgoing = outgoingRef();
  const incoming = incomingRef();
  const direction = normalize(options.direction ?? [-1, 0]);
  const distance = options.distance ?? 1500;
  const blurAmount = options.blur ?? 42;
  const overshoot = options.overshoot ?? 72;
  const settleRatio = clamp(options.settle ?? 0.32, 0.15, 0.5);
  const travelDuration = duration * (1 - settleRatio);
  const settleDuration = duration - travelDuration;
  const outgoingOrigin = position(outgoing);
  const incomingTarget = position(incoming);
  const incomingOvershoot: TransitionPoint = [
    incomingTarget[0] + direction[0] * overshoot,
    incomingTarget[1] + direction[1] * overshoot,
  ];
  incoming.position([incomingTarget[0] - direction[0] * distance, incomingTarget[1] - direction[1] * distance]);
  incoming.filters.blur(blurAmount);
  incoming.opacity(1);

  yield* all(
    outgoing.position([outgoingOrigin[0] + direction[0] * distance, outgoingOrigin[1] + direction[1] * distance], travelDuration, easeInCubic),
    outgoing.filters.blur(blurAmount, travelDuration * 0.72, easeInCubic),
    outgoing.opacity(0, travelDuration * 0.96, easeInCubic),
    incoming.position(incomingOvershoot, travelDuration, easeOutCubic),
    incoming.filters.blur(0, travelDuration, easeOutCubic),
  );
  yield* incoming.position(incomingTarget, settleDuration, easeOutBack);
}

export interface DisplacementRevealOptions {
  direction?: TransitionPoint;
  distance?: number;
  softness?: number;
  stagger?: number;
  seed?: number;
}

/** Displace caller-authored clipped strips in a deterministic noise order. */
export function* displacementReveal(
  outgoingStrips: Array<Reference<Node>>,
  incomingStrips: Array<Reference<Node>>,
  duration = 0.95,
  options: DisplacementRevealOptions = {},
) {
  if (outgoingStrips.length !== incomingStrips.length || outgoingStrips.length === 0) {
    throw new Error('displacementReveal requires equal non-empty outgoing and incoming strip arrays');
  }
  const direction = normalize(options.direction ?? [1, 0]);
  const distance = options.distance ?? 220;
  const softness = clamp(options.softness ?? 0.28, 0.05, 0.7);
  const staggerWindow = clamp(options.stagger ?? 0.42, 0.1, 0.75);
  const random = seeded(options.seed ?? 23);
  const entries = outgoingStrips.map((outgoingRef, index) => {
    const incomingRef = incomingStrips[index];
    const noise = random();
    return {outgoingRef, incomingRef, noise, outgoingOrigin: position(outgoingRef()), incomingTarget: position(incomingRef())};
  });
  const moveDuration = duration * (1 - staggerWindow + softness * 0.2);

  entries.forEach(({incomingRef, incomingTarget, noise}) => {
    incomingRef().position([
      incomingTarget[0] - direction[0] * distance * (0.65 + noise * 0.7),
      incomingTarget[1] - direction[1] * distance * (0.65 + noise * 0.7),
    ]);
    incomingRef().opacity(0);
  });

  yield* all(
    ...entries.flatMap(({outgoingRef, incomingRef, outgoingOrigin, incomingTarget, noise}) => {
      const start = duration * staggerWindow * noise;
      return [
        delay(start, all(
          outgoingRef().position([
            outgoingOrigin[0] + direction[0] * distance * (0.65 + noise * 0.7),
            outgoingOrigin[1] + direction[1] * distance * (0.65 + noise * 0.7),
          ], moveDuration, easeInOutCubic),
          outgoingRef().opacity(0, moveDuration * (0.72 + softness * 0.2), easeInCubic),
        )),
        delay(start + moveDuration * softness, all(
          incomingRef().position(incomingTarget, moveDuration, easeOutCubic),
          incomingRef().opacity(1, moveDuration * (0.72 + softness * 0.2), easeOutCubic),
        )),
      ];
    }),
    waitFor(duration),
  );
}
