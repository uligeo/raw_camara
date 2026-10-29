import type { EditParams, EffectsParams } from '../../types'
import { ControlGroup, type Control } from './ControlGroup'

type Props = {
  params: EditParams
  onChange: (params: EditParams) => void
}

const LABELS: Array<[keyof Omit<EffectsParams, 'dateStamp'>, string]> = [
  ['lightLeak', 'LEAK'],
  ['halation', 'HALATION'],
  ['dust', 'DUST'],
  ['flare', 'FLARE'],
]

export function EffectsPanel({ params, onChange }: Props) {
  const controls: Control[] = LABELS.map(([key, label]) => ({
    key,
    label,
    value: params.effects[key],
    min: 0,
    max: 100,
    onChange: (value) => onChange({ ...params, effects: { ...params.effects, [key]: value } }),
  }))

  const toggleStamp = () =>
    onChange({ ...params, effects: { ...params.effects, dateStamp: !params.effects.dateStamp } })

  return (
    <ControlGroup controls={controls}>
      <div className="group__toggles">
        <button
          type="button"
          aria-pressed={params.effects.dateStamp}
          className={
            params.effects.dateStamp ? 'group__toggle group__toggle--on' : 'group__toggle'
          }
          onClick={toggleStamp}
        >
          DATE STAMP
        </button>
      </div>
    </ControlGroup>
  )
}
