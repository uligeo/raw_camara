import type { Film } from '../types'
import { FAMILY_COLORS } from './recipe'
import { RECIPES } from './recipes'

export const FILMS: Film[] = RECIPES.map((recipe) => ({
  id: recipe.id,
  name: recipe.name,
  recipe,
  defaults: {
    grainAmount: recipe.grain[0],
    grainSize: recipe.grain[1],
    texture: recipe.grain[2],
  },
  canister: FAMILY_COLORS[recipe.family],
}))

export const DEFAULT_FILM = FILMS[0]

export function filmById(id: string): Film {
  return FILMS.find((film) => film.id === id) ?? DEFAULT_FILM
}
