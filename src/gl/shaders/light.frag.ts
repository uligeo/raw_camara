import { PRELUDE } from './common'

export const lightFragment = `${PRELUDE}
uniform float uExposure;
uniform float uContrast;
uniform float uHighlights;
uniform float uShadows;
uniform float uTemperature;
uniform float uTint;
uniform float uSaturation;

void main() {
  vec3 c = texture2D(uImage, vUv).rgb;

  c = pow(max(c, 0.0), vec3(2.2));
  c *= pow(2.0, uExposure * 2.0);
  c = pow(max(c, 0.0), vec3(1.0 / 2.2));

  c.r += uTemperature * 0.10;
  c.b -= uTemperature * 0.10;
  c.g += uTint * 0.08;

  float l = dot(clamp(c, 0.0, 1.0), LUMA);
  c += uHighlights * 0.35 * smoothstep(0.5, 1.0, l);
  c += uShadows * 0.35 * (1.0 - smoothstep(0.0, 0.5, l));

  c = (c - 0.5) * (1.0 + uContrast * 0.8) + 0.5;
  c = mix(vec3(dot(c, LUMA)), c, 1.0 + uSaturation);

  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`
