import { describe, expect, test } from 'vitest'
import { FOCAL_OPTIONS, focalTransform } from './focal'

describe('focal simulada', () => {
  test('35 mm es la base sin alterar', () => {
    expect(focalTransform(35)).toEqual({ zoom: 1, barrel: 0 })
  })

  test('por debajo de 35 hay barril y por encima hay recorte', () => {
    expect(focalTransform(24).barrel).toBeGreaterThan(0)
    expect(focalTransform(85).zoom).toBeGreaterThan(1)
    expect(focalTransform(85).barrel).toBe(0)
  })

  test('el zoom crece de forma monotona con la focal larga', () => {
    expect(focalTransform(85).zoom).toBeGreaterThan(focalTransform(50).zoom)
  })

  test('las cinco focales de la referencia estan disponibles', () => {
    expect(FOCAL_OPTIONS).toEqual([24, 28, 35, 50, 85])
  })
})
