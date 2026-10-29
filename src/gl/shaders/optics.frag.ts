import { PRELUDE } from './common'

export const geometryFragment = `${PRELUDE}
uniform float uZoom;
uniform float uBarrel;

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r2 = dot(p, p);
  p *= 1.0 + uBarrel * r2;
  p /= uZoom;
  vec2 uv = p * 0.5 + 0.5;
  gl_FragColor = texture2D(uImage, clamp(uv, 0.0, 1.0));
}
`

export const lensFragment = `${PRELUDE}
uniform float uVignette;
uniform float uChromatic;

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 1.41421356;
  vec2 shift = p * uChromatic * 0.035 * r;
  vec3 c = vec3(
    texture2D(uImage, clamp(vUv + shift, 0.0, 1.0)).r,
    texture2D(uImage, vUv).g,
    texture2D(uImage, clamp(vUv - shift, 0.0, 1.0)).b
  );
  float v = 1.0 - uVignette * smoothstep(0.3, 1.05, r);
  gl_FragColor = vec4(clamp(c * v, 0.0, 1.0), 1.0);
}
`

export const edgeBlurFragment = `${PRELUDE}
uniform float uAmount;

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 1.41421356;
  float radius = uAmount * smoothstep(0.35, 1.0, r) * 4.0;
  vec3 sum = vec3(0.0);
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      vec2 o = vec2(float(i), float(j)) * uTexel * radius;
      sum += texture2D(uImage, clamp(vUv + o, 0.0, 1.0)).rgb;
    }
  }
  gl_FragColor = vec4(sum / 25.0, 1.0);
}
`
