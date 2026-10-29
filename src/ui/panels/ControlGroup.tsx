import { useState } from 'react'
import { RulerSlider } from '../RulerSlider'
import './ControlGroup.css'

export type Control = {
  key: string
  label: string
  value: number
  min?: number
  max?: number
  suffix?: string
  onChange: (value: number) => void
}

type Props = {
  controls: Control[]
  children?: React.ReactNode
}

export function ControlGroup({ controls, children }: Props) {
  const [activeKey, setActiveKey] = useState(controls[0]?.key)
  const active = controls.find((control) => control.key === activeKey) ?? controls[0]

  return (
    <div className="group">
      {children}
      <div className="group__options" role="tablist">
        {controls.map((control) => (
          <button
            key={control.key}
            type="button"
            role="tab"
            aria-selected={control.key === active?.key}
            className={
              control.key === active?.key ? 'group__option group__option--active' : 'group__option'
            }
            onClick={() => setActiveKey(control.key)}
          >
            <span className="group__dot" style={{ opacity: control.value === 0 ? 0 : 1 }} />
            {control.label}
          </button>
        ))}
      </div>
      {active ? (
        <RulerSlider
          label={active.label}
          value={active.value}
          min={active.min}
          max={active.max}
          suffix={active.suffix}
          onChange={active.onChange}
        />
      ) : null}
    </div>
  )
}
