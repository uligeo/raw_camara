import './Header.css'

type Props = {
  time: string
  canUndo: boolean
  canRedo: boolean
  busy?: boolean
  onClose: () => void
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onSave: () => void
}

export function Header({
  time,
  canUndo,
  canRedo,
  busy = false,
  onClose,
  onUndo,
  onRedo,
  onReset,
  onSave,
}: Props) {
  return (
    <header className="header">
      <div className="header__group">
        <button type="button" className="header__icon" aria-label="Descartar" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
        <button
          type="button"
          className="header__icon"
          aria-label="Deshacer"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M9 7L4 12l5 5M4 12h9a6 6 0 010 12h-1"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </button>
        <button
          type="button"
          className="header__icon"
          aria-label="Rehacer"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M15 7l5 5-5 5M20 12h-9a6 6 0 100 12h1"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </button>
      </div>

      <div className="header__title">
        <span className="header__time">{time}</span>
      </div>

      <div className="header__group">
        <button
          type="button"
          className="header__icon"
          aria-label="Restablecer ajustes"
          onClick={onReset}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="5" cy="12" r="1.6" fill="currentColor" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <circle cx="19" cy="12" r="1.6" fill="currentColor" />
          </svg>
        </button>
        <button type="button" className="header__save" onClick={onSave} disabled={busy}>
          {busy ? 'Guardando' : 'Save'}
        </button>
      </div>
    </header>
  )
}
