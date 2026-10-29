export type FilmFamily =
  | 'negative'
  | 'slide'
  | 'instant'
  | 'mono'
  | 'cross'
  | 'cine'

export type FilmRecipe = {
  id: string
  name: string
  family: FilmFamily
  lift: [number, number, number]
  gamma: [number, number, number]
  gain: [number, number, number]
  sat: number
  contrast: number
  fade: number
  mono: number
  shadowTint: [number, number, number]
  highlightTint: [number, number, number]
  grain: [number, number, number]
}

export const FAMILY_COLORS: Record<FilmFamily, { body: string; label: string; text: string }> = {
  negative: { body: '#d9d4c7', label: '#8d1d2c', text: '#f8f3e8' },
  slide: { body: '#c9d4dc', label: '#1f4f7a', text: '#f2f7fa' },
  instant: { body: '#efece4', label: '#30353d', text: '#30353d' },
  mono: { body: '#4b4b4d', label: '#111113', text: '#efefef' },
  cross: { body: '#c6b4d8', label: '#4c2a6b', text: '#f4ecfb' },
  cine: { body: '#9aa6a0', label: '#1d3a33', text: '#e9f2ee' },
}
