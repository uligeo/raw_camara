import type { Film } from '../types'

type Props = { film: Film; active: boolean }

export function Canister({ film, active }: Props) {
  const { body, label, text } = film.canister
  return (
    <svg width="54" height="64" viewBox="0 0 54 64" aria-hidden="true">
      <defs>
        <linearGradient id={`body-${film.id}`} x1="0" x2="1">
          <stop offset="0" stopColor={body} stopOpacity="0.72" />
          <stop offset="0.35" stopColor={body} />
          <stop offset="1" stopColor={body} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect x="20" y="2" width="14" height="7" rx="2" fill={body} opacity="0.85" />
      <rect x="8" y="8" width="38" height="6" rx="3" fill={body} />
      <rect x="10" y="12" width="34" height="46" rx="4" fill={`url(#body-${film.id})`} />
      <rect x="10" y="22" width="34" height="24" fill={label} />
      <text
        x="27"
        y="37"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        letterSpacing="0.5"
        fill={text}
      >
        {film.name.slice(0, 5).toUpperCase()}
      </text>
      <rect x="10" y="12" width="34" height="46" rx="4" fill="none" stroke="rgba(0,0,0,0.35)" />
      {active ? <rect x="10" y="56" width="34" height="2" fill="var(--accent)" /> : null}
    </svg>
  )
}
