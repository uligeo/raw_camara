import { beforeEach, describe, expect, test } from 'vitest'
import { createContext, onContextLost } from './context'
import { COPY_FRAGMENT, Pipeline } from './pipeline'
import { lightFragment } from './shaders/light.frag'
import { filmFragment } from './shaders/film.frag'
import { grainFragment } from './shaders/grain.frag'
import { geometryFragment, lensFragment, edgeBlurFragment } from './shaders/optics.frag'
import { halationFragment, overlayFragment } from './shaders/effects.frag'

const SIZE = 64

function solid(r: number, g: number, b: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
  ctx.fillRect(0, 0, SIZE, SIZE)
  return canvas
}

// La halacion tiene un radio proporcional al lado mayor, asi que necesita
// una imagen de prueba grande para que el resplandor abarque mas de un pixel.
const SPOT_SIZE = 256

function spot(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = SPOT_SIZE
  canvas.height = SPOT_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, SPOT_SIZE, SPOT_SIZE)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(SPOT_SIZE / 2 - 8, SPOT_SIZE / 2 - 8, 16, 16)
  return canvas
}

let canvas: HTMLCanvasElement
let gl: WebGLRenderingContext
let pipeline: Pipeline

beforeEach(() => {
  canvas = document.createElement('canvas')
  gl = createContext(canvas)
  pipeline = new Pipeline(gl)
})

function pixel(x: number, y: number): number[] {
  const out = new Uint8Array(4)
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out)
  return [out[0], out[1], out[2]]
}

function run(source: HTMLCanvasElement, uniforms: Record<string, unknown>, fragment: string) {
  pipeline.setSource(source, SIZE, SIZE)
  pipeline.render([{ program: pipeline.program(fragment), uniforms: uniforms as never }])
}

describe('canalizacion WebGL', () => {
  test('un paso de identidad devuelve el pixel original', () => {
    run(solid(18, 52, 86), {}, COPY_FRAGMENT)
    const [r, g, b] = pixel(32, 32)
    expect(Math.abs(r - 18)).toBeLessThanOrEqual(2)
    expect(Math.abs(g - 52)).toBeLessThanOrEqual(2)
    expect(Math.abs(b - 86)).toBeLessThanOrEqual(2)
  })

  test('todos los shaders compilan', () => {
    for (const fragment of [
      lightFragment, filmFragment, grainFragment,
      geometryFragment, lensFragment, edgeBlurFragment,
      halationFragment, overlayFragment,
    ]) {
      expect(() => pipeline.program(fragment)).not.toThrow()
    }
  })

  test('dos pasos se encadenan en orden', () => {
    pipeline.setSource(solid(128, 128, 128), SIZE, SIZE)
    pipeline.render([
      { program: pipeline.program(lightFragment), uniforms: { uExposure: 0.5 } as never },
      { program: pipeline.program(lightFragment), uniforms: { uSaturation: -1 } as never },
    ])
    const [r, g, b] = pixel(32, 32)
    expect(Math.abs(r - g)).toBeLessThanOrEqual(2)
    expect(Math.abs(g - b)).toBeLessThanOrEqual(2)
    expect(r).toBeGreaterThan(128)
  })

  test('los valores neutros de luz dejan el pixel igual', () => {
    run(solid(120, 90, 200), {
      uExposure: 0, uContrast: 0, uHighlights: 0, uShadows: 0,
      uTemperature: 0, uTint: 0, uSaturation: 0,
    }, lightFragment)
    const [r, g, b] = pixel(32, 32)
    expect(Math.abs(r - 120)).toBeLessThanOrEqual(3)
    expect(Math.abs(g - 90)).toBeLessThanOrEqual(3)
    expect(Math.abs(b - 200)).toBeLessThanOrEqual(3)
  })

  test('la exposicion aclara el gris medio y no quema el blanco a negro', () => {
    run(solid(128, 128, 128), { uExposure: 1 }, lightFragment)
    expect(pixel(32, 32)[0]).toBeGreaterThan(160)
    run(solid(255, 255, 255), { uExposure: 1 }, lightFragment)
    expect(pixel(32, 32)[0]).toBeGreaterThan(250)
  })

  test('la saturacion a menos uno iguala los tres canales', () => {
    run(solid(220, 30, 30), { uSaturation: -1 }, lightFragment)
    const [r, g, b] = pixel(32, 32)
    expect(Math.abs(r - g)).toBeLessThanOrEqual(2)
    expect(Math.abs(g - b)).toBeLessThanOrEqual(2)
  })

  test('las altas luces no tocan las sombras', () => {
    run(solid(16, 16, 16), { uHighlights: 1 }, lightFragment)
    expect(pixel(32, 32)[0]).toBeLessThanOrEqual(20)
  })

  test('la pelicula neutra con intensidad cero no altera nada', () => {
    run(solid(140, 90, 60), {
      uLift: [0, 0, 0], uGamma: [1, 1, 1], uGain: [1, 1, 1],
      uShadowTint: [0, 0, 0], uHighlightTint: [0, 0, 0],
      uSat: 1, uFilmContrast: 0, uFade: 0, uMono: 0, uIntensity: 0,
    }, filmFragment)
    const [r, g, b] = pixel(32, 32)
    expect(Math.abs(r - 140)).toBeLessThanOrEqual(2)
    expect(Math.abs(g - 90)).toBeLessThanOrEqual(2)
    expect(Math.abs(b - 60)).toBeLessThanOrEqual(2)
  })

  test('la pelicula monocroma iguala los canales', () => {
    run(solid(200, 40, 40), {
      uLift: [0, 0, 0], uGamma: [1, 1, 1], uGain: [1, 1, 1],
      uShadowTint: [0, 0, 0], uHighlightTint: [0, 0, 0],
      uSat: 0, uFilmContrast: 0, uFade: 0, uMono: 1, uIntensity: 1,
    }, filmFragment)
    const [r, g, b] = pixel(32, 32)
    expect(Math.abs(r - g)).toBeLessThanOrEqual(2)
    expect(Math.abs(g - b)).toBeLessThanOrEqual(2)
  })

  test('el grano a cero no cambia nada', () => {
    run(solid(128, 128, 128), { uAmount: 0, uSize: 0.5, uTexture: 0, uSeed: 3 }, grainFragment)
    expect(Math.abs(pixel(32, 32)[0] - 128)).toBeLessThanOrEqual(2)
  })

  test('el grano es mas visible en los medios que en el blanco', () => {
    const spread = (value: number) => {
      run(solid(value, value, value), { uAmount: 1, uSize: 0.5, uTexture: 0, uSeed: 3 }, grainFragment)
      let min = 255
      let max = 0
      for (let i = 0; i < 24; i += 1) {
        const v = pixel(i * 2, 32)[0]
        min = Math.min(min, v)
        max = Math.max(max, v)
      }
      return max - min
    }
    expect(spread(128)).toBeGreaterThan(spread(255))
  })

  test('el vineteado oscurece la esquina y respeta el centro', () => {
    run(solid(200, 200, 200), { uVignette: 1, uChromatic: 0 }, lensFragment)
    expect(pixel(32, 32)[0]).toBeGreaterThan(190)
    expect(pixel(1, 1)[0]).toBeLessThan(120)
  })

  test('la halacion tine alrededor de una alta luz y no el fondo lejano', () => {
    pipeline.setSource(spot(), SPOT_SIZE, SPOT_SIZE)
    pipeline.render([
      {
        program: pipeline.program(halationFragment),
        uniforms: { uAmount: 1, uThreshold: 0.6 } as never,
      },
    ])
    const near = pixel(128, 118)
    expect(near[0]).toBeGreaterThan(0)
    expect(near[0]).toBeGreaterThan(near[2])
    expect(pixel(4, 4)[0]).toBeLessThanOrEqual(6)
  })

  test('la geometria a 35 mm no mueve la imagen', () => {
    run(solid(90, 140, 190), { uZoom: 1, uBarrel: 0 }, geometryFragment)
    const [r, g, b] = pixel(32, 32)
    expect([r, g, b]).toEqual([90, 140, 190])
  })

  test('la perdida de contexto avisa y dispose no lanza', () => {
    let lost = false
    onContextLost(canvas, () => {
      lost = true
    })
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    expect(lost).toBe(true)
    expect(() => pipeline.dispose()).not.toThrow()
  })
})
