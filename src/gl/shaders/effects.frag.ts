import { PRELUDE } from './common'

export const halationFragment = `${PRELUDE}
uniform float uAmount;
uniform float uThreshold;

void main() {
  vec3 c = texture2D(uImage, vUv).rgb;
  vec3 glow = vec3(0.0);
  float spread = max(uResolution.x, uResolution.y) * 0.012;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5235988;
    vec2 dir = vec2(cos(a), sin(a));
    for (int j = 1; j <= 2; j++) {
      vec2 o = dir * float(j) * spread * uTexel;
      vec3 s = texture2D(uImage, clamp(vUv + o, 0.0, 1.0)).rgb;
      glow += s * max(0.0, dot(s, LUMA) - uThreshold);
    }
  }
  glow /= 24.0;
  vec3 tint = vec3(1.0, 0.32, 0.16);
  gl_FragColor = vec4(clamp(c + glow * tint * uAmount * 4.0, 0.0, 1.0), 1.0);
}
`

export const overlayFragment = `${PRELUDE}
uniform sampler2D uOverlay;
uniform float uAmount;
uniform float uBlend;

void main() {
  vec3 c = texture2D(uImage, vUv).rgb;
  vec3 o = texture2D(uOverlay, vUv).rgb;
  vec3 screen = 1.0 - (1.0 - c) * (1.0 - o);
  vec3 multiply = c * o;
  vec3 blended = mix(screen, multiply, uBlend);
  gl_FragColor = vec4(clamp(mix(c, blended, uAmount), 0.0, 1.0), 1.0);
}
`
