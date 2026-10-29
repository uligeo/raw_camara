import { describe, expect, test } from 'vitest'
import { FILMS, filmById } from './catalog'

const BANNED = [
  'kodak', 'fuji', 'fujifilm', 'ilford', 'portra', 'velvia', 'provia',
  'tri-x', 'trix', 'polaroid', 'agfa', 'cinestill', 'ektar', 'superia',
]

describe('catalogo de peliculas', () => {
  test('el catalogo ofrece al menos cincuenta carretes con identificador unico', () => {
    const ids = FILMS.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBeGreaterThanOrEqual(50)
  })

  test('ningun carrete usa el nombre de una marca real', () => {
    for (const film of FILMS) {
      expect(BANNED).not.toContain(film.name.toLowerCase())
      expect(BANNED).not.toContain(film.id.toLowerCase())
    }
  })

  test('toda pelicula declara una receta de color utilizable', () => {
    for (const film of FILMS) {
      expect(film.recipe.gamma.every((v) => v > 0)).toBe(true)
      expect(film.recipe.sat).toBeGreaterThanOrEqual(0)
      expect(film.defaults.grainSize).toBeGreaterThan(0)
    }
  })

  test('los carretes cubren varias familias', () => {
    expect(new Set(FILMS.map((f) => f.recipe.family)).size).toBeGreaterThanOrEqual(5)
  })

  test('un identificador desconocido cae al carrete por defecto', () => {
    expect(filmById('no-existe').id).toBe(FILMS[0].id)
  })
})
