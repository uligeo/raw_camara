import { PRELUDE } from './common'

export const grainFragment = `${PRELUDE}
uniform float uAmount;
uniform float uSize;
uniform float uTexture;
uniform float uSeed;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 c = texture2D(uImage, vUv).rgb;

  // El grano se calcula en el espacio normalizado de la imagen, nunca en
  // pixeles de salida: asi se ve igual en el visor y en la exportacion.
  float cells = mix(1400.0, 320.0, clamp(uSize, 0.0, 1.0));
  float n = hash(floor(vUv * cells) + uSeed) - 0.5;
  float l = dot(c, LUMA);
  float mask = 1.0 - abs(l * 2.0 - 1.0);
  c += n * uAmount * 0.38 * mask;

  float t = (hash(floor(vUv * 210.0) + uSeed + 7.0) - 0.5) * uTexture * 0.10;
  c += t;

  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`
