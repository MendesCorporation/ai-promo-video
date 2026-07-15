import {Camera, Scene, Vector2, WebGLRenderer} from 'three';
import {
  BlendFunction,
  BloomEffect,
  ChromaticAberrationEffect,
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  VignetteEffect,
} from 'postprocessing';

export interface PostProcessingOptions {
  bloom?: false | {intensity?: number; threshold?: number};
  depthOfField?: false | {focusDistance?: number; focalLength?: number; bokehScale?: number};
  chromaticAberration?: false | {offset?: [number, number]};
  grain?: false | {opacity?: number};
  vignette?: false | {offset?: number; darkness?: number};
}

/** Build a selective Three.js finishing stack; no effect is enabled implicitly. */
export function createPostProcessing(renderer: WebGLRenderer, scene: Scene, camera: Camera, options: PostProcessingOptions = {}) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const effects = [];
  if (options.bloom) effects.push(new BloomEffect({intensity: options.bloom.intensity ?? 1.1, luminanceThreshold: options.bloom.threshold ?? 0.72}));
  if (options.depthOfField) effects.push(new DepthOfFieldEffect(camera, {
    focusDistance: options.depthOfField.focusDistance ?? 0.02,
    focalLength: options.depthOfField.focalLength ?? 0.045,
    bokehScale: options.depthOfField.bokehScale ?? 2.2,
  }));
  if (options.chromaticAberration) effects.push(new ChromaticAberrationEffect({offset: new Vector2(...(options.chromaticAberration.offset ?? [0.0015, 0.001]))}));
  if (options.grain) {
    const noise = new NoiseEffect({blendFunction: BlendFunction.SOFT_LIGHT});
    noise.blendMode.opacity.value = options.grain.opacity ?? 0.16;
    effects.push(noise);
  }
  if (options.vignette) effects.push(new VignetteEffect({offset: options.vignette.offset ?? 0.25, darkness: options.vignette.darkness ?? 0.58}));
  if (effects.length) composer.addPass(new EffectPass(camera, ...effects));
  return composer;
}
