import type { EditParams, LightParams } from '../../types'
import { ControlGroup, type Control } from './ControlGroup'

type Props = {
  params: EditParams
  onChange: (params: EditParams) => void
}

const LABELS: Array<[keyof LightParams, string]> = [
  ['exposure', 'EXPOSURE'],
  ['contrast', 'CONTRAST'],
  ['highlights', 'HIGHLIGHTS'],
  ['shadows', 'SHADOWS'],
  ['temperature', 'TEMP'],
  ['tint', 'TINT'],
  ['saturation', 'SATURATION'],
]

export function LightPanel({ params, onChange }: Props) {
  const controls: Control[] = LABELS.map(([key, label]) => ({
    key,
    label,
    value: params.light[key],
    onChange: (value) => onChange({ ...params, light: { ...params.light, [key]: value } }),
  }))
  return <ControlGroup controls={controls} />
}
