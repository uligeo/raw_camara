import { describe, expect, test } from 'vitest'
import {
  DEFAULT_PARAMS,
  applyFilm,
  clone,
  isDefault,
  touchFilmValue,
} from './params'
import { FILMS } from '../films/catalog'
import type { Film } from '../types'

const film: Film = {
  ...FILMS[1],
  defaults: { grainAmount: 30, grainSize: 60, texture: 20 },
}

describe('parametros de edicion', () => {
  test('los valores por defecto dejan la imagen sin alterar', () => {
    expect(DEFAULT_PARAMS.optics.focalMm).toBe(35)
    expect(DEFAULT_PARAMS.light.exposure).toBe(0)
    expect(DEFAULT_PARAMS.crop.rect).toEqual({ x: 0, y: 0, w: 1, h: 1 })
    expect(isDefault(DEFAULT_PARAMS)).toBe(true)
  })

  test('clone no comparte referencias anidadas', () => {
    const copy = clone(DEFAULT_PARAMS)
    copy.crop.rect.x = 0.5
    copy.film.touched.texture = true
    expect(DEFAULT_PARAMS.crop.rect.x).toBe(0)
    expect(DEFAULT_PARAMS.film.touched.texture).toBe(false)
  })

  test('cambiar de carrete aplica sus valores por defecto', () => {
    const next = applyFilm(DEFAULT_PARAMS, film)
    expect(next.film.filmId).toBe(film.id)
    expect(next.film.grainAmount).toBe(30)
    expect(next.film.texture).toBe(20)
  })

  test('cambiar de carrete respeta lo que el usuario ya toco', () => {
    const touched = touchFilmValue(DEFAULT_PARAMS, 'grainAmount', 15)
    const next = applyFilm(touched, film)
    expect(next.film.grainAmount).toBe(15)
    expect(next.film.texture).toBe(20)
  })
})
