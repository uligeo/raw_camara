import type { FilmRecipe } from './films/recipe'

export type Aspect = '1:1' | '4:3' | '3:2' | '16:9' | 'free'

export type FocalMm = 24 | 28 | 35 | 50 | 85

export type CropRect = { x: number; y: number; w: number; h: number }

export type LightParams = {
  exposure: number
  contrast: number
  highlights: number
  shadows: number
  temperature: number
  tint: number
  saturation: number
}

export type FilmDefaultKey = 'grainAmount' | 'grainSize' | 'texture'

export type FilmParams = {
  filmId: string
  intensity: number
  grainAmount: number
  grainSize: number
  texture: number
  develop: number
  touched: Record<FilmDefaultKey, boolean>
}

export type OpticsParams = {
  focalMm: FocalMm
  vignette: number
  chromatic: number
  edgeBlur: number
}

export type EffectsParams = {
  lightLeak: number
  halation: number
  dust: number
  flare: number
  dateStamp: boolean
}

export type CropParams = {
  aspect: Aspect
  rotation: number
  mirror: boolean
  rect: CropRect
}

export type EditParams = {
  light: LightParams
  film: FilmParams
  optics: OpticsParams
  effects: EffectsParams
  crop: CropParams
}

export type Film = {
  id: string
  name: string
  recipe: FilmRecipe
  defaults: Pick<FilmParams, 'grainAmount' | 'grainSize' | 'texture'>
  canister: { body: string; label: string; text: string }
}
