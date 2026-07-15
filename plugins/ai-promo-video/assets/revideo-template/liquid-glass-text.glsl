#version 300 es
precision highp float;

#include "@revideo/core/shaders/common.glsl"

uniform float refractionStrength;
uniform float dispersionStrength;
uniform float thickness;
uniform float revealProgress;
uniform float lightAngle;
uniform float liquidPhase;
uniform float sweepPosition;
uniform vec3 glassTint;

float glyphMask(vec2 uv) {
  return texture(sourceTexture, clamp(uv, vec2(0.001), vec2(0.999))).a;
}

vec3 sampleDispersed(vec2 uv, vec2 direction, float amount) {
  vec2 redUv = clamp(uv + direction * amount, vec2(0.002), vec2(0.998));
  vec2 blueUv = clamp(uv - direction * amount, vec2(0.002), vec2(0.998));
  return vec3(
    texture(destinationTexture, redUv).r,
    texture(destinationTexture, uv).g,
    texture(destinationTexture, blueUv).b
  );
}

void main() {
  float glyph = glyphMask(sourceUV);
  vec2 texel = 1.0 / resolution;
  float sampleRadius = mix(3.0, 14.0, clamp(thickness, 0.0, 1.0));
  vec2 stepSize = texel * sampleRadius;

  float left = glyphMask(sourceUV - vec2(stepSize.x, 0.0));
  float right = glyphMask(sourceUV + vec2(stepSize.x, 0.0));
  float above = glyphMask(sourceUV - vec2(0.0, stepSize.y));
  float below = glyphMask(sourceUV + vec2(0.0, stepSize.y));
  vec2 gradient = vec2(left - right, above - below);
  float gradientLength = length(gradient);
  vec2 edgeNormal = gradient / max(gradientLength, 0.0001);

  float inset = min(min(left, right), min(above, below));
  float bevel = clamp((glyph - inset) * 1.45 + gradientLength * 0.72, 0.0, 1.0);
  bevel = max(bevel, 4.0 * glyph * (1.0 - glyph));

  float revealWave = sin(sourceUV.y * 22.0 + liquidPhase * 1.6) * 0.026
    + sin(sourceUV.y * 8.0 - liquidPhase * 0.9) * 0.012;
  float revealFront = sourceUV.x + revealWave;
  float materialReveal = smoothstep(revealFront - 0.055, revealFront + 0.02, revealProgress);
  float mask = glyph * materialReveal;

  vec2 liquidNormal = vec2(
    sin(sourceUV.y * 18.0 + liquidPhase * 1.7),
    cos(sourceUV.x * 15.0 - liquidPhase * 1.25)
  );
  vec2 opticalNormal = normalize(edgeNormal + liquidNormal * (0.055 + 0.09 * (1.0 - bevel)) + vec2(0.0001));
  float opticalStrength = refractionStrength * materialReveal * (0.16 + 0.84 * pow(bevel, 1.35));
  vec2 tangent = vec2(-opticalNormal.y, opticalNormal.x);
  vec2 refractedUv = destinationUV
    - opticalNormal * opticalStrength
    + tangent * sin(liquidPhase + sourceUV.y * 12.0) * refractionStrength * 0.045;
  refractedUv = clamp(refractedUv, vec2(0.002), vec2(0.998));

  float chroma = dispersionStrength * materialReveal * pow(bevel, 1.7);
  vec3 refracted = sampleDispersed(refractedUv, opticalNormal, chroma);
  float luminance = dot(refracted, vec3(0.2126, 0.7152, 0.0722));
  float adaptiveTint = mix(0.13, 0.055, smoothstep(0.2, 0.8, luminance));
  vec3 color = mix(refracted, glassTint, adaptiveTint);
  color = (color - 0.5) * 1.11 + 0.5;

  float body = smoothstep(0.16, 0.94, glyph) * (1.0 - bevel * 0.42);
  float lightBackdrop = smoothstep(0.58, 0.88, luminance);
  vec3 adaptiveBodyTint = mix(glassTint * 1.04, glassTint * 0.46, lightBackdrop);
  color = mix(color, adaptiveBodyTint, body * mix(0.09, 0.23, lightBackdrop));

  vec2 lightDirection = normalize(vec2(cos(lightAngle), sin(lightAngle)));
  float facingLight = max(dot(edgeNormal, lightDirection), 0.0);
  float specular = pow(facingLight, 7.0) * pow(bevel, 0.85);
  float shadowEdge = pow(max(dot(-edgeNormal, lightDirection), 0.0), 2.0) * bevel;

  float sweepAxis = sourceUV.x + sourceUV.y * 0.14;
  float sweep = exp(-pow((sweepAxis - sweepPosition) * 12.0, 2.0));
  float innerCaustic = sin(sourceUV.y * 28.0 + sourceUV.x * 9.0 + liquidPhase * 2.0)
    * 0.5 + 0.5;
  innerCaustic *= bevel * 0.08;

  color += vec3(1.0, 0.98, 0.93) * specular * 0.54;
  color += vec3(0.72, 0.9, 1.0) * pow(bevel, 2.4) * 0.15;
  color += vec3(1.0) * sweep * (0.1 + 0.25 * bevel);
  color += vec3(0.55, 0.82, 1.0) * innerCaustic;
  color *= 1.0 - shadowEdge * 0.2;

  outColor = vec4(clamp(color, 0.0, 1.0), mask);
}
