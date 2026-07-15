/** @jsxImportSource @revideo/2d/lib */
import {Layout, Line, Rect, Txt} from '@revideo/2d';
import {Reference} from '@revideo/core';

export type VideoFormatId = 'landscape' | 'portrait' | 'square';
export type PlatformTarget = 'generic' | 'tiktok' | 'instagram-reels' | 'youtube-shorts';
export type Insets = {top: number; right: number; bottom: number; left: number};

export interface FormatProfile {
  id: VideoFormatId;
  width: number;
  height: number;
  platform: PlatformTarget;
  safeArea: Insets;
}

const dimensions: Record<VideoFormatId, [number, number]> = {
  landscape: [1920, 1080],
  portrait: [1080, 1920],
  square: [1080, 1080],
};

const safeAreas: Record<VideoFormatId, Record<PlatformTarget, Insets>> = {
  landscape: {
    generic: {top: 0.05, right: 0.05, bottom: 0.05, left: 0.05},
    tiktok: {top: 0.08, right: 0.12, bottom: 0.14, left: 0.06},
    'instagram-reels': {top: 0.07, right: 0.1, bottom: 0.13, left: 0.06},
    'youtube-shorts': {top: 0.07, right: 0.11, bottom: 0.12, left: 0.06},
  },
  portrait: {
    generic: {top: 0.06, right: 0.08, bottom: 0.12, left: 0.08},
    tiktok: {top: 0.1, right: 0.18, bottom: 0.22, left: 0.07},
    'instagram-reels': {top: 0.08, right: 0.13, bottom: 0.2, left: 0.08},
    'youtube-shorts': {top: 0.08, right: 0.15, bottom: 0.18, left: 0.08},
  },
  square: {
    generic: {top: 0.06, right: 0.06, bottom: 0.08, left: 0.06},
    tiktok: {top: 0.08, right: 0.14, bottom: 0.16, left: 0.07},
    'instagram-reels': {top: 0.07, right: 0.1, bottom: 0.14, left: 0.07},
    'youtube-shorts': {top: 0.07, right: 0.12, bottom: 0.14, left: 0.07},
  },
};

export function formatProfile(id: VideoFormatId = 'landscape', platform: PlatformTarget = 'generic', override: Partial<FormatProfile> = {}): FormatProfile {
  const [width, height] = dimensions[id];
  return {id, width, height, platform, safeArea: safeAreas[id][platform], ...override};
}

export function adaptiveValue<T>(format: VideoFormatId, values: {landscape: T; portrait: T; square: T}): T {
  return values[format];
}

export function safeAreaPixels(profile: FormatProfile): Insets {
  return {
    top: profile.safeArea.top * profile.height,
    right: profile.safeArea.right * profile.width,
    bottom: profile.safeArea.bottom * profile.height,
    left: profile.safeArea.left * profile.width,
  };
}

export function safeAreaBounds(profile: FormatProfile) {
  const insets = safeAreaPixels(profile);
  const width = profile.width - insets.left - insets.right;
  const height = profile.height - insets.top - insets.bottom;
  return {
    width,
    height,
    x: (insets.left - insets.right) / 2,
    y: (insets.top - insets.bottom) / 2,
    insets,
  };
}

export interface SafeAreaOverlayProps {
  profile: FormatProfile;
  color?: string;
  label?: string;
  ref?: Reference<Layout>;
}

/** Authoring overlay only. Remove or hide it before the delivery render. */
export function SafeAreaOverlay({profile, color = '#ffcc66', label = 'SAFE AREA — AUTHORING ONLY', ref}: SafeAreaOverlayProps) {
  const bounds = safeAreaBounds(profile);
  return (
    <Layout ref={ref} width={profile.width} height={profile.height} opacity={0.72}>
      <Rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} stroke={color} lineWidth={3} lineDash={[16, 12]} />
      <Line points={[[-profile.width / 2, bounds.y - bounds.height / 2], [profile.width / 2, bounds.y - bounds.height / 2]]} stroke={`${color}66`} lineWidth={2} />
      <Line points={[[-profile.width / 2, bounds.y + bounds.height / 2], [profile.width / 2, bounds.y + bounds.height / 2]]} stroke={`${color}66`} lineWidth={2} />
      <Txt x={bounds.x - bounds.width / 2 + 12} y={bounds.y - bounds.height / 2 - 24} offset={[-1, 0]} text={label} fill={color} fontFamily={'Inter, sans-serif'} fontSize={20} fontWeight={700} />
    </Layout>
  );
}

export interface FocalCropOptions {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  focal?: [number, number];
  overscan?: number;
}

/** Return scale and centered-media offset for a cover crop around a normalized focal point. */
export function focalCrop({sourceWidth, sourceHeight, targetWidth, targetHeight, focal = [0.5, 0.5], overscan = 1}: FocalCropOptions) {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight) * overscan;
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const unclampedX = (0.5 - focal[0]) * renderedWidth;
  const unclampedY = (0.5 - focal[1]) * renderedHeight;
  const maxX = Math.max(0, (renderedWidth - targetWidth) / 2);
  const maxY = Math.max(0, (renderedHeight - targetHeight) / 2);
  return {
    scale,
    position: [Math.max(-maxX, Math.min(maxX, unclampedX)), Math.max(-maxY, Math.min(maxY, unclampedY))] as [number, number],
  };
}

export interface AdaptiveStageProps {
  profile: FormatProfile;
  children?: any;
  ref?: Reference<Rect>;
  fill?: string;
}

export function AdaptiveStage({profile, children, ref, fill = '#000000'}: AdaptiveStageProps) {
  const bounds = safeAreaBounds(profile);
  return <Rect ref={ref} width={profile.width} height={profile.height} fill={fill} clip><Layout x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height}>{children}</Layout></Rect>;
}

export interface PortraitProductStageProps {
  width?: number;
  height?: number;
  radius?: number;
  children?: any;
  ref?: Reference<Rect>;
  x?: number;
  y?: number;
  position?: [number, number];
  rotation?: number;
  scale?: number;
  opacity?: number;
}

/** A portrait product window sized for detail crops, not a shrunken desktop screenshot. */
export function PortraitProductStage({width = 900, height = 1120, radius = 42, children, ref, x, y, position, rotation, scale, opacity}: PortraitProductStageProps) {
  return <Rect ref={ref} x={x} y={y} position={position} rotation={rotation} scale={scale} opacity={opacity} width={width} height={height} radius={radius} fill={'#0c0f17'} stroke={'#ffffff24'} lineWidth={2} shadowColor={'#000000b8'} shadowBlur={72} clip>{children}</Rect>;
}
