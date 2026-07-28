import type {Node} from '@revideo/2d';
import {
  Reference,
  all,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  tween,
  waitFor,
} from '@revideo/core';
import {ambientCamera, ambientParallax, type AmbientCameraOptions, type AmbientParallaxOptions} from './ambient';
import {assertSceneNodesMounted} from './scene-tree';

export type CameraPoint = [number, number];

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function position(node: Node): CameraPoint {
  const value = node.position();
  return [value.x, value.y];
}

function scale(node: Node): CameraPoint {
  const value = node.scale();
  return [value.x, value.y];
}

function normalize(point: CameraPoint): CameraPoint {
  const length = Math.hypot(point[0], point[1]) || 1;
  return [point[0] / length, point[1] / length];
}

export interface DollyInOptions {
  target?: CameraPoint;
  scale?: number;
  drift?: CameraPoint;
  roll?: number;
  arc?: number;
}

/** Dolly a world rig toward one focal coordinate with a subtle curved travel path. */
export function* dollyIn(cameraRef: Reference<Node>, duration = 1.4, options: DollyInOptions = {}) {
  const camera = cameraRef();
  assertSceneNodesMounted(camera, 'dollyIn camera');
  const origin = position(camera);
  const initialScale = scale(camera);
  const initialRotation = camera.rotation();
  const target = options.target ?? [0, 0];
  const zoom = Math.max(0.1, options.scale ?? 1.28);
  const drift = options.drift ?? [26, -12];
  const destination: CameraPoint = [
    origin[0] - target[0] * (zoom - 1) + drift[0],
    origin[1] - target[1] * (zoom - 1) + drift[1],
  ];
  const arc = options.arc ?? 22;

  yield* tween(duration, (raw) => {
    const progress = easeInOutCubic(raw);
    const curve = Math.sin(Math.PI * progress) * arc;
    camera.position([
      mix(origin[0], destination[0], progress),
      mix(origin[1], destination[1], progress) - curve,
    ]);
    camera.scale([mix(initialScale[0], initialScale[0] * zoom, progress), mix(initialScale[1], initialScale[1] * zoom, progress)]);
    camera.rotation(mix(initialRotation, initialRotation + (options.roll ?? 0.35), progress));
  });
}

/** Named catalog wrapper around the continuous ambient camera primitive. */
export function ambientCameraRig(cameraRef: Reference<Node>, duration: number, options: AmbientCameraOptions = {}) {
  assertSceneNodesMounted(cameraRef(), 'ambientCameraRig camera');
  return ambientCamera(cameraRef, duration, options);
}

/** Named catalog wrapper around the continuous multi-depth parallax primitive. */
export function ambientParallaxRig(layerRefs: Array<Reference<Node>>, duration: number, options: AmbientParallaxOptions = {}) {
  assertSceneNodesMounted(layerRefs.map((ref) => ref()), 'ambientParallaxRig layers');
  return ambientParallax(layerRefs, duration, options);
}

export interface OrbitSweepOptions {
  focus?: CameraPoint;
  arcDegrees?: number;
  radius?: CameraPoint;
  zoom?: number;
  roll?: number;
  planeTilt?: CameraPoint;
  planeRef?: Reference<Node>;
}

/** Arc a 2.5D world rig around a focus while counter-shaping the product plane. */
export function* orbitSweep(cameraRef: Reference<Node>, duration = 1.6, options: OrbitSweepOptions = {}) {
  const camera = cameraRef();
  assertSceneNodesMounted([camera, ...(options.planeRef ? [options.planeRef()] : [])], 'orbitSweep nodes');
  const origin = position(camera);
  const initialScale = scale(camera);
  const initialRotation = camera.rotation();
  const focus = options.focus ?? [0, 0];
  const radius = options.radius ?? [90, 42];
  const arc = (options.arcDegrees ?? 24) * Math.PI / 180;
  const plane = options.planeRef?.();
  const planeScale = plane ? scale(plane) : undefined;
  const planeSkew = plane?.skew();
  const tilt = options.planeTilt ?? [-7, 4];

  yield* tween(duration, (raw) => {
    const progress = easeInOutCubic(raw);
    const angle = mix(-arc / 2, arc / 2, progress);
    camera.position([
      origin[0] - focus[0] * ((options.zoom ?? 1.08) - 1) + Math.sin(angle) * radius[0],
      origin[1] - focus[1] * ((options.zoom ?? 1.08) - 1) - (1 - Math.cos(angle)) * radius[1],
    ]);
    camera.scale([
      initialScale[0] * mix(1, options.zoom ?? 1.08, progress),
      initialScale[1] * mix(1, options.zoom ?? 1.08, progress),
    ]);
    camera.rotation(initialRotation + Math.sin(angle) * (options.roll ?? 1.8));
    if (plane && planeScale && planeSkew) {
      plane.skew([mix(planeSkew.x, tilt[0], progress), mix(planeSkew.y, tilt[1], progress)]);
      plane.scale([planeScale[0] * (1 - Math.abs(Math.sin(angle)) * 0.025), planeScale[1]]);
    }
  });
}

export interface FocusTarget {
  point: CameraPoint;
  scale?: number;
  rotation?: number;
  duration?: number;
  hold?: number;
  framing?: CameraPoint;
  anticipation?: number;
}

export interface FocusTrackOptions {
  defaultDuration?: number;
  defaultScale?: number;
  anticipationDistance?: number;
  positionBounds?: {x: CameraPoint; y: CameraPoint};
  scaleBounds?: CameraPoint;
}

/** Follow authored UI regions on a continuous curved path, with optional safe framing bounds. */
export function* focusTrack(cameraRef: Reference<Node>, targets: FocusTarget[], options: FocusTrackOptions = {}) {
  if (targets.length === 0) return;
  const camera = cameraRef();
  assertSceneNodesMounted(camera, 'focusTrack camera');
  for (const target of targets) {
    const current = position(camera);
    const currentScale = scale(camera);
    const requestedZoom = target.scale ?? options.defaultScale ?? 1.22;
    const zoom = options.scaleBounds
      ? clamp(requestedZoom, Math.min(...options.scaleBounds), Math.max(...options.scaleBounds))
      : requestedZoom;
    const framing = target.framing ?? [0, 0];
    const requestedDestination: CameraPoint = [framing[0] - target.point[0] * zoom, framing[1] - target.point[1] * zoom];
    const destination: CameraPoint = options.positionBounds ? [
      clamp(requestedDestination[0], Math.min(...options.positionBounds.x), Math.max(...options.positionBounds.x)),
      clamp(requestedDestination[1], Math.min(...options.positionBounds.y), Math.max(...options.positionBounds.y)),
    ] : requestedDestination;
    const vector = normalize([destination[0] - current[0], destination[1] - current[1]]);
    const anticipation = target.anticipation ?? options.anticipationDistance ?? 18;
    const duration = target.duration ?? options.defaultDuration ?? 0.8;
    const control: CameraPoint = [current[0] - vector[0] * anticipation, current[1] - vector[1] * anticipation];
    const currentRotation = camera.rotation();
    const targetRotation = target.rotation ?? currentRotation;
    yield* tween(duration, (raw) => {
      const progress = easeInOutCubic(raw);
      const inverse = 1 - progress;
      camera.position([
        inverse * inverse * current[0] + 2 * inverse * progress * control[0] + progress * progress * destination[0],
        inverse * inverse * current[1] + 2 * inverse * progress * control[1] + progress * progress * destination[1],
      ]);
      camera.scale([mix(currentScale[0], zoom, progress), mix(currentScale[1], zoom, progress)]);
      camera.rotation(mix(currentRotation, targetRotation, progress));
    });
    if ((target.hold ?? 0) > 0) yield* waitFor(target.hold!);
  }
}

export interface ParallaxPanOptions {
  direction?: CameraPoint;
  distance?: number;
  depths?: number[];
  zoom?: number;
  subjectIndex?: number;
}

/** Pan three or more authored layers at distinct depth rates while stabilizing the focal subject. */
export function parallaxPan(layerRefs: Array<Reference<Node>>, duration = 1.6, options: ParallaxPanOptions = {}) {
  if (layerRefs.length < 2) throw new Error('parallaxPan requires at least two depth layers');
  assertSceneNodesMounted(layerRefs.map((ref) => ref()), 'parallaxPan layers');
  const direction = normalize(options.direction ?? [-1, 0]);
  const distance = options.distance ?? 180;
  const subjectIndex = options.subjectIndex ?? Math.floor(layerRefs.length / 2);
  return all(...layerRefs.map((ref, index) => {
    const node = ref();
    const origin = position(node);
    const initialScale = scale(node);
    const defaultDepth = index === subjectIndex ? 0.2 : (index + 1) / layerRefs.length;
    const depth = options.depths?.[index] ?? defaultDepth;
    return all(
      node.position([origin[0] + direction[0] * distance * depth, origin[1] + direction[1] * distance * depth], duration, easeInOutCubic),
      node.scale([
        initialScale[0] * (1 + (options.zoom ?? 0.018) * depth),
        initialScale[1] * (1 + (options.zoom ?? 0.018) * depth),
      ], duration, easeInOutCubic),
    );
  }));
}

export interface PerspectiveTiltOptions {
  fromSkew?: CameraPoint;
  toSkew?: CameraPoint;
  fromRotation?: number;
  toRotation?: number;
  fromScale?: CameraPoint;
  toScale?: CameraPoint;
  position?: CameraPoint;
  blur?: number;
}

/** Animate through a 2.5D product-plane tilt instead of holding a static skewed screenshot. */
export function* perspectiveTilt(frameRef: Reference<Node>, duration = 1.25, options: PerspectiveTiltOptions = {}) {
  const frame = frameRef();
  assertSceneNodesMounted(frame, 'perspectiveTilt frame');
  const originalPosition = position(frame);
  const originalScale = scale(frame);
  const fromSkew = options.fromSkew ?? [-8, 3];
  const toSkew = options.toSkew ?? [5, -2];
  const fromScale = options.fromScale ?? [originalScale[0] * 0.92, originalScale[1] * 0.98];
  const toScale = options.toScale ?? [originalScale[0] * 1.04, originalScale[1] * 1.01];
  const fromRotation = options.fromRotation ?? -3;
  const toRotation = options.toRotation ?? 1.2;
  const destination = options.position ?? [originalPosition[0] + 34, originalPosition[1] - 16];
  const blurAmount = Math.max(0, options.blur ?? 5);
  frame.skew(fromSkew);
  frame.scale(fromScale);
  frame.rotation(fromRotation);
  frame.filters.blur(blurAmount);

  yield* all(
    frame.skew(toSkew, duration, easeInOutCubic),
    frame.scale(toScale, duration, easeOutBack),
    frame.rotation(toRotation, duration, easeInOutCubic),
    frame.position(destination, duration, easeInOutCubic),
    frame.filters.blur(0, duration * 0.55, easeOutCubic),
  );
}

export interface CameraPathKeyframe {
  position: CameraPoint;
  scale?: number | CameraPoint;
  rotation?: number;
  duration: number;
  hold?: number;
}

export interface ContinuousCameraPathKeyframe {
  position: CameraPoint;
  scale?: number | CameraPoint;
  rotation?: number;
  /** Travel time from the preceding state to this state. */
  duration: number;
}

function hermiteScalar(
  from: number,
  to: number,
  fromVelocity: number,
  toVelocity: number,
  segmentDuration: number,
  progress: number,
) {
  const progress2 = progress * progress;
  const progress3 = progress2 * progress;
  return (2 * progress3 - 3 * progress2 + 1) * from
    + (progress3 - 2 * progress2 + progress) * segmentDuration * fromVelocity
    + (-2 * progress3 + 3 * progress2) * to
    + (progress3 - progress2) * segmentDuration * toVelocity;
}

function tangent(values: number[], times: number[], index: number) {
  if (values.length < 2) return 0;
  if (index === 0 || index === values.length - 1) return 0;
  return (values[index + 1] - values[index - 1]) / (times[index + 1] - times[index - 1]);
}

function continuousValue(values: number[], times: number[], elapsed: number) {
  const last = values.length - 1;
  if (elapsed <= 0) return values[0];
  if (elapsed >= times[last]) return values[last];
  let segment = 0;
  while (segment < last - 1 && elapsed > times[segment + 1]) segment += 1;
  const duration = times[segment + 1] - times[segment];
  const progress = (elapsed - times[segment]) / duration;
  return hermiteScalar(
    values[segment],
    values[segment + 1],
    tangent(values, times, segment),
    tangent(values, times, segment + 1),
    duration,
    progress,
  );
}

/**
 * Move through all camera targets in one C1-continuous timeline. Unlike
 * cameraPath, intermediate beats do not ease to zero velocity.
 */
export function* continuousCameraPath(cameraRef: Reference<Node>, keyframes: ContinuousCameraPathKeyframe[]) {
  if (keyframes.length === 0) return;
  if (keyframes.some((keyframe) => !Number.isFinite(keyframe.duration) || keyframe.duration <= 0)) {
    throw new Error('continuousCameraPath keyframe durations must be greater than zero');
  }
  const camera = cameraRef();
  assertSceneNodesMounted(camera, 'continuousCameraPath camera');
  const initialPosition = position(camera);
  const initialScale = scale(camera);
  const positions = [initialPosition, ...keyframes.map((keyframe) => keyframe.position)];
  const scales = [initialScale];
  const rotations = [camera.rotation()];
  for (const keyframe of keyframes) {
    const precedingScale = scales.at(-1)!;
    scales.push(typeof keyframe.scale === 'number'
      ? [keyframe.scale, keyframe.scale]
      : keyframe.scale ?? precedingScale);
    rotations.push(keyframe.rotation ?? rotations.at(-1)!);
  }
  const times = [0];
  for (const keyframe of keyframes) times.push(times.at(-1)! + keyframe.duration);
  const totalDuration = times.at(-1)!;

  yield* tween(totalDuration, (progress) => {
    const elapsed = progress * totalDuration;
    camera.position([
      continuousValue(positions.map((point) => point[0]), times, elapsed),
      continuousValue(positions.map((point) => point[1]), times, elapsed),
    ]);
    camera.scale([
      continuousValue(scales.map((point) => point[0]), times, elapsed),
      continuousValue(scales.map((point) => point[1]), times, elapsed),
    ]);
    camera.rotation(continuousValue(rotations, times, elapsed));
  });
}

/** Open custom escape hatch for any authored camera path not represented by catalog rigs. */
export function* cameraPath(cameraRef: Reference<Node>, keyframes: CameraPathKeyframe[]) {
  const camera = cameraRef();
  assertSceneNodesMounted(camera, 'cameraPath camera');
  for (const keyframe of keyframes) {
    const targetScale = typeof keyframe.scale === 'number' ? [keyframe.scale, keyframe.scale] as CameraPoint : keyframe.scale ?? scale(camera);
    yield* all(
      camera.position(keyframe.position, keyframe.duration, easeInOutCubic),
      camera.scale(targetScale, keyframe.duration, easeInOutCubic),
      camera.rotation(keyframe.rotation ?? camera.rotation(), keyframe.duration, easeInOutCubic),
    );
    if ((keyframe.hold ?? 0) > 0) yield* waitFor(keyframe.hold!);
  }
}
