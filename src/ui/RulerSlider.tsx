import { useId } from 'react'
import './RulerSlider.css'

type Props = {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}

const TICKS = 41

export function RulerSlider({
  label,
  value,
  min = -100,
  max = 100,
  step = 1,
  suffix = '',
  onChange,
}: Props) {
  const id = useId()
  const ratio = (value - min) / (max - min)

  return (
    <div className="ruler">
      <div className="ruler__head">
        <label className="ruler__label" htmlFor={id}>
          {label}
        </label>
        <span className="ruler__value">
          {Math.round(value)}
          {suffix}
        </span>
      </div>
      <div className="ruler__track">
        <div className="ruler__ticks" aria-hidden="true">
          {Array.from({ length: TICKS }, (_, index) => (
            <span
              key={index}
              className={index % 5 === 0 ? 'ruler__tick ruler__tick--major' : 'ruler__tick'}
            />
          ))}
        </div>
        <div className="ruler__cursor" style={{ left: `${ratio * 100}%` }} aria-hidden="true" />
        <input
          id={id}
          className="ruler__input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  )
}
