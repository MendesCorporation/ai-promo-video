/** @jsxImportSource @revideo/2d/lib */
import {Txt} from '@revideo/2d';
import type {TxtProps} from '@revideo/2d';
import type {Reference} from '@revideo/core';
import liquidGlassTextShader from './liquid-glass-text.glsl';

type Reactive<T> = T | (() => T);

function read<T>(value: Reactive<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

export interface LiquidGlassTextProps extends Omit<TxtProps, 'ref' | 'fill' | 'shaders'> {
  refraction?: Reactive<number>;
  dispersion?: Reactive<number>;
  thickness?: Reactive<number>;
  reveal?: Reactive<number>;
  lightAngle?: Reactive<number>;
  phase?: Reactive<number>;
  sweep?: Reactive<number>;
  tint?: Reactive<[number, number, number]>;
  ref?: Reference<Txt>;
}

/** Use a short, large, heavy word as a live optical mask over structured motion. */
export function LiquidGlassText({
  refraction = 0.038,
  dispersion = 0.0045,
  thickness = 0.72,
  reveal = 1,
  lightAngle = -0.65,
  phase = 0,
  sweep = -0.2,
  tint = [0.82, 0.93, 1],
  ref,
  ...textProps
}: LiquidGlassTextProps) {
  return (
    <Txt
      {...textProps}
      ref={ref}
      fill={'#ffffff'}
      shaders={() => ({
        fragment: liquidGlassTextShader,
        uniforms: {
          refractionStrength: read(refraction),
          dispersionStrength: read(dispersion),
          thickness: read(thickness),
          revealProgress: read(reveal),
          lightAngle: read(lightAngle),
          liquidPhase: read(phase),
          sweepPosition: read(sweep),
          glassTint: read(tint),
        },
      })}
    />
  );
}
