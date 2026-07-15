#version 300 es
precision highp float;

#include "@revideo/core/shaders/common.glsl"

uniform float distortion;
uniform float phase;

void main() {
  vec2 direction = normalize(sourceUV - vec2(0.5) + vec2(0.0001));
  float falloff = smoothstep(0.72, 0.04, length(sourceUV - vec2(0.5)));
  float wave = sin((sourceUV.y + phase * 0.08) * 22.0) * distortion;
  vec2 refractedUV = destinationUV + direction * distortion * falloff;
  refractedUV.x += wave * falloff;

  vec4 destination = texture(destinationTexture, refractedUV);
  vec4 source = texture(sourceTexture, sourceUV);
  vec3 glass = destination.rgb * 1.08 + vec3(0.04, 0.055, 0.09);
  glass = mix(glass, source.rgb, source.a * 0.34);
  outColor = vec4(glass, 0.96);
}
