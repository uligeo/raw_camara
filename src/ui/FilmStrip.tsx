import type { Film } from '../types'
import { Canister } from './Canister'
import './FilmStrip.css'

type Props = {
  films: Film[]
  selectedId: string
  onSelect: (film: Film) => void
}

export function FilmStrip({ films, selectedId, onSelect }: Props) {
  return (
    <div className="strip" role="listbox" aria-label="Carrete">
      {films.map((film) => {
        const active = film.id === selectedId
        return (
          <button
            key={film.id}
            type="button"
            role="option"
            aria-selected={active}
            className={active ? 'strip__item strip__item--active' : 'strip__item'}
            onClick={() => onSelect(film)}
          >
            <Canister film={film} active={active} />
            <span className="strip__name">{film.name.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}
