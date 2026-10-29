import { FILMS } from '../../films/catalog'
import { applyFilm, touchFilmValue } from '../../state/params'
import type { EditParams } from '../../types'
import { FilmStrip } from '../FilmStrip'
import { ControlGroup, type Control } from './ControlGroup'

type Props = {
  params: EditParams
  onChange: (params: EditParams) => void
}

export function FilmPanel({ params, onChange }: Props) {
  const controls: Control[] = [
    {
      key: 'grainAmount',
      label: 'GRAIN',
      value: params.film.grainAmount,
      min: 0,
      max: 100,
      onChange: (value) => onChange(touchFilmValue(params, 'grainAmount', value)),
    },
    {
      key: 'grainSize',
      label: 'SIZE',
      value: params.film.grainSize,
      min: 0,
      max: 100,
      onChange: (value) => onChange(touchFilmValue(params, 'grainSize', value)),
    },
    {
      key: 'texture',
      label: 'TEXTURE',
      value: params.film.texture,
      min: 0,
      max: 100,
      onChange: (value) => onChange(touchFilmValue(params, 'texture', value)),
    },
    {
      key: 'develop',
      label: 'DEVELOP',
      value: params.film.develop,
      min: -2,
      max: 2,
      onChange: (value) =>
        onChange({ ...params, film: { ...params.film, develop: value } }),
    },
    {
      key: 'intensity',
      label: 'INTENSITY',
      value: params.film.intensity,
      min: 0,
      max: 100,
      onChange: (value) =>
        onChange({ ...params, film: { ...params.film, intensity: value } }),
    },
  ]

  return (
    <ControlGroup controls={controls}>
      <FilmStrip
        films={FILMS}
        selectedId={params.film.filmId}
        onSelect={(film) => onChange(applyFilm(params, film))}
      />
    </ControlGroup>
  )
}
