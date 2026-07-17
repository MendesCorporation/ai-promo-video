import {Gradient} from '@revideo/2d';

export interface NativeGradientStop {
  /** Normalized position from 0 (start) to 1 (end). */
  offset: number;
  /** Any color value accepted by Revideo, including #RRGGBBAA. */
  color: string;
}

export interface LinearGradientOptions {
  from: [number, number];
  to: [number, number];
  stops: NativeGradientStop[];
}

export interface CssAngleLinearGradientOptions {
  /** Painted bounds in local Revideo coordinates. */
  width: number;
  height: number;
  /** CSS-compatible direction: 0deg points up, 90deg right, 180deg down. */
  angleDegrees?: number;
  stops: NativeGradientStop[];
}

export interface RadialGradientOptions {
  from?: [number, number];
  to?: [number, number];
  fromRadius?: number;
  toRadius: number;
  stops: NativeGradientStop[];
}

function validatedStops(stops: NativeGradientStop[]): NativeGradientStop[] {
  if (stops.length < 2) throw new Error('A Revideo gradient requires at least two stops');
  let previous = -1;
  for (const stop of stops) {
    if (!Number.isFinite(stop.offset) || stop.offset < 0 || stop.offset > 1) {
      throw new Error('Gradient stop offsets must be finite values between 0 and 1');
    }
    if (stop.offset < previous) throw new Error('Gradient stops must be ordered by offset');
    if (!stop.color) throw new Error('Every gradient stop requires a color');
    previous = stop.offset;
  }
  return stops;
}

/** Create a native Revideo linear paint. Never pass CSS linear-gradient(...) to fill/stroke. */
export function linearGradient({from, to, stops}: LinearGradientOptions): Gradient {
  return new Gradient({type: 'linear', from, to, stops: validatedStops(stops)});
}

/**
 * Convert CSS angle semantics into a native Revideo linear Gradient over known local bounds.
 * This accepts structured values, not a CSS gradient string, so geometry remains explicit.
 */
export function cssAngleLinearGradient({
  width,
  height,
  angleDegrees = 180,
  stops,
}: CssAngleLinearGradientOptions): Gradient {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error('cssAngleLinearGradient width and height must be positive finite values');
  }
  const radians = angleDegrees * Math.PI / 180;
  const directionX = Math.sin(radians);
  const directionY = -Math.cos(radians);
  const span = Math.abs(width * directionX) + Math.abs(height * directionY);
  const half = span / 2;
  return linearGradient({
    from: [-directionX * half, -directionY * half],
    to: [directionX * half, directionY * half],
    stops,
  });
}

/** Create a native Revideo radial paint with explicit local geometry. */
export function radialGradient({
  from = [0, 0],
  to = [0, 0],
  fromRadius = 0,
  toRadius,
  stops,
}: RadialGradientOptions): Gradient {
  if (!Number.isFinite(fromRadius) || fromRadius < 0 || !Number.isFinite(toRadius) || toRadius <= fromRadius) {
    throw new Error('Radial gradient radii must be finite and toRadius must be greater than fromRadius');
  }
  return new Gradient({
    type: 'radial',
    from,
    to,
    fromRadius,
    toRadius,
    stops: validatedStops(stops),
  });
}
