import {Path} from '@revideo/2d';
import {Reference, easeInOutCubic, sequence, tween} from '@revideo/core';
import {interpolate} from 'flubber';
import {parse} from 'opentype.js';

export interface GlyphPathResult {
  paths: string[];
  advanceWidth: number;
  ascender: number;
  descender: number;
}

/** Convert a user-supplied licensed font buffer into centered vector glyph paths. */
export function textToGlyphPaths(fontBuffer: ArrayBuffer, text: string, fontSize: number, decimalPlaces = 2): GlyphPathResult {
  const font = parse(fontBuffer);
  const advanceWidth = font.getAdvanceWidth(text, fontSize, {kerning: true});
  const scale = fontSize / font.unitsPerEm;
  return {
    paths: font.getPaths(text, -advanceWidth / 2, 0, fontSize, {kerning: true}).map((path) => path.toPathData(decimalPlaces)),
    advanceWidth,
    ascender: font.ascender * scale,
    descender: font.descender * scale,
  };
}

export function drawGlyphOutlines(refs: Array<Reference<Path>>, duration = 0.8, stagger = 0.04) {
  refs.forEach((ref) => ref().end(0));
  return sequence(stagger, ...refs.map((ref) => ref().end(1, duration)));
}

/** Morph arbitrary SVG paths using Flubber's topology normalization. */
export function* morphVectorPath(ref: Reference<Path>, from: string, to: string, duration = 0.8, maxSegmentLength = 8) {
  const morph = interpolate(from, to, {maxSegmentLength});
  ref().data(from);
  yield* tween(duration, (value) => ref().data(morph(easeInOutCubic(value))));
  ref().data(to);
}

export interface TextOnPathPose {
  position: [number, number];
  rotation: number;
}

/** Sample readable glyph poses along a polyline; author Path nodes or Txt glyphs from the result. */
export function textOnPolyline(points: Array<[number, number]>, count: number, startOffset = 0): TextOnPathPose[] {
  if (points.length < 2 || count < 1) return [];
  const segments = points.slice(1).map((point, index) => {
    const previous = points[index];
    const dx = point[0] - previous[0];
    const dy = point[1] - previous[1];
    return {from: previous, to: point, length: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) * 180 / Math.PI};
  });
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  return Array.from({length: count}, (_, index) => {
    let distance = Math.max(0, Math.min(total, startOffset + total * ((index + 0.5) / count)));
    const segment = segments.find((candidate) => {
      if (distance <= candidate.length) return true;
      distance -= candidate.length;
      return false;
    }) ?? segments[segments.length - 1];
    const progress = segment.length ? distance / segment.length : 0;
    return {
      position: [segment.from[0] + (segment.to[0] - segment.from[0]) * progress, segment.from[1] + (segment.to[1] - segment.from[1]) * progress],
      rotation: segment.angle,
    };
  });
}
