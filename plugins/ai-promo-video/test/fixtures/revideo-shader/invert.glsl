#version 300 es
precision highp float;

#include "@revideo/core/shaders/common.glsl"

void main() {
  vec4 source = texture(sourceTexture, sourceUV);
  outColor = vec4(1.0 - source.rgb, source.a);
}
