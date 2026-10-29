import { PRELUDE } from './common'

export const filmFragment = `${PRELUDE}
uniform vec3 uLift;
uniform vec3 uGamma;
uniform vec3 uGain;
uniform vec3 uShadowTint;
uniform vec3 uHighlightTint;
uniform float uSat;
uniform float uFilmContrast;
uniform float uFade;
uniform float uMono;
uniform float uIntensity;

void main() {
  vec3 src = clamp(texture2D(uImage, vUv).rgb, 0.0, 1.0);
  vec3 c = src;

  if (uMono > 0.0) {
    c = mix(c, vec3(dot(c, vec3(0.30, 0.59, 0.11))), uMono);
  }

  c = uLift + pow(max(c, 0.0), 1.0 / max(uGamma, vec3(0.05))) * uGain;

  float l = dot(clamp(c, 0.0, 1.0), LUMA);
  c += uShadowTint * (1.0 - smoothstep(0.0, 0.55, l));
  c += uHighlightTint * smoothstep(0.45, 1.0, l);

  c = (c - 0.5) * (1.0 + uFilmContrast) + 0.5;
  c = mix(vec3(dot(c, LUMA)), c, uSat);
  c = c * (1.0 - uFade) + uFade;

  gl_FragColor = vec4(mix(src, clamp(c, 0.0, 1.0), uIntensity), 1.0);
}
`
