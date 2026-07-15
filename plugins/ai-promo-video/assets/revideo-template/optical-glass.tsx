/** @jsxImportSource @revideo/2d/lib */
import {Layout, Rect} from '@revideo/2d';
import type {LayoutProps, RectProps} from '@revideo/2d';
import type {Reference} from '@revideo/core';
import opticalGlassShader from './optical-glass.glsl';

type Reactive<T> = T | (() => T);
export type OpticalGlassTint = [number, number, number];
export type OpticalGlassPoint = [number, number];

function read<T>(value: Reactive<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

export interface OpticalGlassProps extends Pick<LayoutProps, 'x' | 'y' | 'position' | 'rotation' | 'scale' | 'opacity' | 'zIndex'> {
  width?: Reactive<number>;
  height?: Reactive<number>;
  radius?: Reactive<number>;
  bevel?: Reactive<number>;
  refraction?: Reactive<number>;
  dispersion?: Reactive<number>;
  reveal?: Reactive<number>;
  lightAngle?: Reactive<number>;
  interaction?: Reactive<number>;
  phase?: Reactive<number>;
  touchPoint?: Reactive<OpticalGlassPoint>;
  tint?: Reactive<OpticalGlassTint>;
  rimStroke?: RectProps['stroke'];
  rimWidth?: Reactive<number>;
  rimOpacity?: Reactive<number>;
  shadowColor?: RectProps['shadowColor'];
  shadowBlur?: Reactive<number>;
  shadowOffsetY?: Reactive<number>;
  shadowOpacity?: Reactive<number>;
  children?: any;
  ref?: Reference<Layout>;
  surfaceRef?: Reference<Rect>;
  rimRef?: Reference<Rect>;
  shadowRef?: Reference<Rect>;
}

/**
 * A neutral optical material. It refracts already-rendered layers through
 * destinationTexture; author its content and choreography in the scene.
 * The project must enable Revideo experimentalFeatures.
 */
export function OpticalGlass({
  width = 640,
  height = 180,
  radius = 72,
  bevel = 0.46,
  refraction = 0.06,
  dispersion = 0.005,
  reveal = 1,
  lightAngle = -0.8,
  interaction = 0,
  phase = 0,
  touchPoint = [0.72, 0.52],
  tint = [0.79, 0.9, 1],
  rimStroke = '#ffffff5c',
  rimWidth = 1.5,
  rimOpacity = 1,
  shadowColor = '#08101f78',
  shadowBlur = 56,
  shadowOffsetY = 18,
  shadowOpacity = 1,
  children,
  ref,
  surfaceRef,
  rimRef,
  shadowRef,
  ...layoutProps
}: OpticalGlassProps) {
  return (
    <Layout ref={ref} {...layoutProps}>
      <Rect
        ref={shadowRef}
        y={shadowOffsetY}
        width={width}
        height={height}
        radius={radius}
        fill={'#0a102024'}
        opacity={shadowOpacity}
        shadowColor={shadowColor}
        shadowBlur={shadowBlur}
        shadowOffsetY={shadowOffsetY}
      />
      <Rect
        ref={surfaceRef}
        width={width}
        height={height}
        radius={radius}
        fill={'#ffffff01'}
        shaders={() => ({
          fragment: opticalGlassShader,
          uniforms: {
            lensAspect: read(width) / Math.max(read(height), 1),
            cornerRadius: Math.min(0.99, read(radius) / (Math.max(read(height), 1) / 2)),
            bevelWidth: read(bevel),
            refractionStrength: read(refraction),
            dispersionStrength: read(dispersion),
            revealProgress: read(reveal),
            lightAngle: read(lightAngle),
            interactionEnergy: read(interaction),
            liquidPhase: read(phase),
            touchPoint: read(touchPoint),
            glassTint: read(tint),
          },
        })}
      />
      <Rect
        ref={rimRef}
        width={width}
        height={height}
        radius={radius}
        fill={'#ffffff00'}
        stroke={rimStroke}
        lineWidth={rimWidth}
        opacity={rimOpacity}
      />
      {children}
    </Layout>
  );
}
