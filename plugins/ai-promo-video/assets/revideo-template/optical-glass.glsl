#version 300 es
precision highp float;

#include "@revideo/core/shaders/common.glsl"

uniform float lensAspect;
uniform float cornerRadius;
uniform float bevelWidth;
uniform float refractionStrength;
uniform float dispersionStrength;
uniform float revealProgress;
uniform float lightAngle;
uniform float interactionEnergy;
uniform float liquidPhase;
uniform vec2 touchPoint;
uniform vec3 glassTint;

float sdRoundBox(vec2 point, vec2 halfSize, float radius) {
  vec2 q = abs(point) - halfSize + radius;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

float glassDistance(vec2 point) {
  return sdRoundBox(point, vec2(lensAspect, 1.0), cornerRadius);
}

vec3 sampleDispersed(vec2 uv, vec2 direction, float amount) {
  vec2 redUv = clamp(uv + direction * amount, vec2(0.002), vec2(0.998));
  vec2 blueUv = clamp(uv - direction * amount, vec2(0.002), vec2(0.998));
  vec2 greenUv = clamp(uv, vec2(0.002), vec2(0.998));
  return vec3(
    texture(destinationTexture, redUv).r,
    texture(destinationTexture, greenUv).g,
    texture(destinationTexture, blueUv).b
  );
}

void main() {
  vec2 point = (sourceUV - 0.5) * vec2(2.0 * lensAspect, 2.0);
  float distanceField = glassDistance(point);
  float mask = 1.0 - smoothstep(-0.004, 0.012, distanceField);
  float depthInside = max(-distanceField, 0.0);
  float bevel = 1.0 - smoothstep(0.0, max(bevelWidth, 0.001), depthInside);

  float epsilon = 0.003;
  vec2 gradient = vec2(
    glassDistance(point + vec2(epsilon, 0.0)) - glassDistance(point - vec2(epsilon, 0.0)),
    glassDistance(point + vec2(0.0, epsilon)) - glassDistance(point - vec2(0.0, epsilon))
  );
  vec2 normal = gradient / max(length(gradient), 0.0001);
  vec2 uvNormal = normalize(normal / vec2(max(lensAspect, 0.001), 1.0) + vec2(0.00001));

  float liquidWave = sin(sourceUV.y * 15.0 + liquidPhase * 1.7)
    * cos(sourceUV.x * 10.0 - liquidPhase * 1.1);
  float edgeLens = pow(clamp(bevel, 0.0, 1.0), 1.75);
  float interactionBulge = interactionEnergy
    * exp(-distance(sourceUV, touchPoint) * 7.5);
  float opticalStrength = revealProgress
    * (refractionStrength * (0.14 * bevel + 0.86 * edgeLens)
      + interactionBulge * 0.018);
  opticalStrength *= 1.0 + liquidWave * (0.035 + interactionEnergy * 0.035);

  vec2 tangent = vec2(-uvNormal.y, uvNormal.x);
  vec2 refractedUv = destinationUV
    - uvNormal * opticalStrength
    + tangent * liquidWave * refractionStrength * 0.055 * edgeLens;
  refractedUv = clamp(refractedUv, vec2(0.002), vec2(0.998));

  float chroma = revealProgress * dispersionStrength * pow(bevel, 2.1);
  vec3 refracted = sampleDispersed(refractedUv, uvNormal, chroma);

  vec2 texel = 1.0 / resolution;
  float scatter = revealProgress * (0.28 + interactionEnergy * 0.35) * (0.3 + bevel);
  vec3 softSample = (
    texture(destinationTexture, refractedUv + vec2(texel.x, 0.0)).rgb
    + texture(destinationTexture, refractedUv - vec2(texel.x, 0.0)).rgb
    + texture(destinationTexture, refractedUv + vec2(0.0, texel.y)).rgb
    + texture(destinationTexture, refractedUv - vec2(0.0, texel.y)).rgb
  ) * 0.25;
  refracted = mix(refracted, softSample, scatter * 0.18);

  float luminance = dot(refracted, vec3(0.2126, 0.7152, 0.0722));
  float adaptiveTint = mix(0.085, 0.035, smoothstep(0.18, 0.82, luminance));
  vec3 color = mix(refracted, glassTint, adaptiveTint * revealProgress);
  color = (color - 0.5) * (1.0 + 0.07 * revealProgress) + 0.5;

  vec2 lightDirection = normalize(vec2(cos(lightAngle), sin(lightAngle)));
  float facingLight = max(dot(-normal, lightDirection), 0.0);
  float facingShadow = max(dot(normal, lightDirection), 0.0);
  float specular = pow(facingLight, 9.0) * pow(bevel, 1.25);
  float fineRim = pow(bevel, 5.0);

  float sweepAxis = dot(sourceUV - 0.5, normalize(vec2(0.72, -0.48)));
  float sweepPosition = sin(liquidPhase * 0.72) * 0.34;
  float travelingHighlight = exp(-pow((sweepAxis - sweepPosition) * 12.0, 2.0))
    * pow(bevel, 0.72);

  float touchGlow = interactionEnergy
    * exp(-distance(sourceUV, touchPoint) * 6.0)
    * (0.35 + 0.65 * bevel);
  vec3 warmSpecular = vec3(1.0, 0.975, 0.91);
  vec3 coolCaustic = vec3(0.7, 0.88, 1.0);
  color += warmSpecular * specular * 0.52 * revealProgress;
  color += coolCaustic * fineRim * 0.12 * revealProgress;
  color += vec3(1.0) * travelingHighlight * 0.16 * revealProgress;
  color += mix(coolCaustic, warmSpecular, touchPoint.x) * touchGlow * 0.34;
  color *= 1.0 - facingShadow * fineRim * 0.17 * revealProgress;

  float innerLine = smoothstep(0.055, 0.0, abs(depthInside - 0.035));
  color += vec3(0.82, 0.93, 1.0) * innerLine * 0.08 * revealProgress;

  outColor = vec4(clamp(color, 0.0, 1.0), mask);
}
