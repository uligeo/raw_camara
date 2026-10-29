import type { EditParams, Film, FilmDefaultKey } from '../types'

export const FULL_RECT = { x: 0, y: 0, w: 1, h: 1 }

const FILM_DEFAULT_KEYS: FilmDefaultKey[] = ['grainAmount', 'grainSize', 'texture']

export const DEFAULT_PARAMS: EditParams = {
  light: {
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0,
    saturation: 0,
  },
  film: {
    filmId: 'nova',
    intensity: 100,
    grainAmount: 0,
    grainSize: 50,
    texture: 0,
    develop: 0,
    touched: { grainAmount: false, grainSize: false, texture: false },
  },
  optics: { focalMm: 35, vignette: 0, chromatic: 0, edgeBlur: 0 },
  effects: { lightLeak: 0, halation: 0, dust: 0, flare: 0, dateStamp: false },
  crop: { aspect: 'free', rotation: 0, mirror: false, rect: { ...FULL_RECT } },
}

export function clone(params: EditParams): EditParams {
  return {
    light: { ...params.light },
    film: { ...params.film, touched: { ...params.film.touched } },
    optics: { ...params.optics },
    effects: { ...params.effects },
    crop: { ...params.crop, rect: { ...params.crop.rect } },
  }
}

export function isDefault(params: EditParams): boolean {
  const d = DEFAULT_PARAMS
  return (
    JSON.stringify({ ...params, film: { ...params.film, filmId: d.film.filmId } }) ===
    JSON.stringify(d)
  )
}

export function applyFilm(params: EditParams, film: Film): EditParams {
  const next = clone(params)
  next.film.filmId = film.id
  for (const key of FILM_DEFAULT_KEYS) {
    if (!next.film.touched[key]) next.film[key] = film.defaults[key]
  }
  return next
}

export function touchFilmValue(
  params: EditParams,
  key: FilmDefaultKey,
  value: number,
): EditParams {
  const next = clone(params)
  next.film[key] = value
  next.film.touched[key] = true
  return next
}

export function withDefaultsOf(film: Film): EditParams {
  return applyFilm(DEFAULT_PARAMS, film)
}
