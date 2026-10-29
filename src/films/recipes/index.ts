import type { FilmRecipe } from '../recipe'
import { NEGATIVE_RECIPES } from './negative'
import { SLIDE_RECIPES } from './slide'
import { INSTANT_RECIPES } from './instant'
import { MONO_RECIPES } from './mono'
import { CROSS_RECIPES } from './cross'
import { CINE_RECIPES } from './cine'

export const RECIPES: FilmRecipe[] = [
  ...NEGATIVE_RECIPES,
  ...SLIDE_RECIPES,
  ...INSTANT_RECIPES,
  ...MONO_RECIPES,
  ...CROSS_RECIPES,
  ...CINE_RECIPES,
]
