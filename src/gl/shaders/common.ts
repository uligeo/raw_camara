export const PRELUDE = `
precision mediump float;
uniform sampler2D uImage;
uniform vec2 uResolution;
uniform vec2 uTexel;
varying vec2 vUv;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
`
