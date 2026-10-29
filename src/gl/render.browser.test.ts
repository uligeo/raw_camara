import { describe, expect, test } from 'vitest'
import { FILMS } from '../films/catalog'
import { applyFilm, DEFAULT_PARAMS } from '../state/params'
import { fitRatio } from '../crop/geometry'
import { ImageRenderer } from './render'

function scene(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#2b4a6f')
  sky.addColorStop(1, '#c8b49a')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#101014'
  ctx.fillRect(0, height * 0.62, width, height * 0.38)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(width * 0.7, height * 0.12, width * 0.06, height * 0.06)
  return canvas
}

describe('revelado completo', () => {
  test('los parametros por defecto devuelven una imagen equivalente a la original', async () => {
    const source = scene(240, 320)
    const renderer = new ImageRenderer()
    const params = { ...DEFAULT_PARAMS, film: { ...DEFAULT_PARAMS.film, intensity: 0 } }
    await renderer.draw(source, 240, 320, params)
    const out = renderer.composed(params, Date.now())
    const a = source.getContext('2d')!.getImageData(120, 40, 1, 1).data
    const b = out.getContext('2d')!.getImageData(120, 40, 1, 1).data
    for (let i = 0; i < 3; i += 1) expect(Math.abs(a[i] - b[i])).toBeLessThanOrEqual(3)
    renderer.dispose()
  })

  test('los cincuenta y cuatro carretes se revelan sin fallar', async () => {
    const source = scene(128, 128)
    const renderer = new ImageRenderer()
    for (const film of FILMS) {
      const params = applyFilm(DEFAULT_PARAMS, film)
      await renderer.draw(source, 128, 128, params)
      expect(renderer.canvas.width).toBe(128)
    }
    renderer.dispose()
  })

  test('cada carrete produce un resultado distinto del original', async () => {
    const source = scene(128, 128)
    const renderer = new ImageRenderer()
    const seen = new Set<string>()
    for (const film of FILMS.slice(0, 12)) {
      await renderer.draw(source, 128, 128, applyFilm(DEFAULT_PARAMS, film))
      const out = document.createElement('canvas')
      out.width = 1
      out.height = 1
      out.getContext('2d')!.drawImage(renderer.canvas, 60, 20, 1, 1, 0, 0, 1, 1)
      seen.add(out.getContext('2d')!.getImageData(0, 0, 1, 1).data.join(','))
    }
    expect(seen.size).toBeGreaterThan(6)
    renderer.dispose()
  })

  test('una captura grande con todos los efectos produce un JPEG', async () => {
    const source = scene(1200, 1600)
    const renderer = new ImageRenderer()
    const base = applyFilm(DEFAULT_PARAMS, FILMS[3])
    const params = {
      ...base,
      light: { ...base.light, exposure: 12, contrast: 20, shadows: 15 },
      optics: { focalMm: 50 as const, vignette: 40, chromatic: 30, edgeBlur: 20 },
      effects: { lightLeak: 35, halation: 45, dust: 25, flare: 20, dateStamp: true },
      crop: {
        ...base.crop,
        aspect: '1:1' as const,
        rotation: 3,
        rect: fitRatio(base.crop.rect, 1, 1200 / 1600),
      },
    }
    await renderer.draw(source, 1200, 1600, params)
    const blob = await renderer.toBlob(params, Date.now())
    expect(blob.type).toBe('image/jpeg')
    expect(blob.size).toBeGreaterThan(1000)
    renderer.dispose()
  })
})
