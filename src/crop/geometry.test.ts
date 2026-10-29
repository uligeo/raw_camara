import { describe, expect, test } from 'vitest'
import { clampRect, fitAspect, outputSize, rotatedBounds } from './geometry'

const FULL = { x: 0, y: 0, w: 1, h: 1 }

describe('geometria de recorte', () => {
  test('fitAspect produce la proporcion pedida', () => {
    const imageAspect = 1500 / 1000
    const r = fitAspect(FULL, '1:1', imageAspect)
    expect((r.w * 1500) / (r.h * 1000)).toBeCloseTo(1, 5)
  })

  test('el rectangulo en fracciones sobrevive al cambio de orientacion', () => {
    const r = fitAspect(FULL, '16:9', 1000 / 1500)
    expect(clampRect(r)).toEqual(r)
    expect(r.x).toBeGreaterThanOrEqual(0)
    expect(r.y + r.h).toBeLessThanOrEqual(1)
  })

  test('rotar 90 grados intercambia los lados del encuadre', () => {
    expect(rotatedBounds(100, 50, 90)).toEqual({ w: 50, h: 100 })
  })

  test('clampRect devuelve un rectangulo dentro de la imagen', () => {
    const r = clampRect({ x: -0.4, y: 1.2, w: 1.5, h: 0.01 })
    expect(r.x).toBe(0)
    expect(r.w).toBe(1)
    expect(r.y + r.h).toBeLessThanOrEqual(1)
    expect(r.h).toBeGreaterThanOrEqual(0.05)
  })

  test('free deja el rectangulo tal cual', () => {
    const r = { x: 0.1, y: 0.2, w: 0.5, h: 0.5 }
    expect(fitAspect(r, 'free', 1.5)).toEqual(r)
  })

  test('outputSize mide el recorte en pixeles', () => {
    expect(outputSize({ w: 4000, h: 3000 }, { x: 0, y: 0, w: 0.5, h: 0.5 }, 0)).toEqual({
      w: 2000,
      h: 1500,
    })
  })
})
