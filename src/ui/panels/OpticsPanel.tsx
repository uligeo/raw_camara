import { FOCAL_OPTIONS } from '../../optics/focal'
import type { EditParams, FocalMm } from '../../types'
import { ControlGroup, type Control } from './ControlGroup'

type Props = {
  params: EditParams
  onChange: (params: EditParams) => void
}

export function OpticsPanel({ params, onChange }: Props) {
  const controls: Control[] = [
    {
      key: 'vignette',
      label: 'VIGNETTE',
      value: params.optics.vignette,
      min: 0,
      max: 100,
      onChange: (value) => onChange({ ...params, optics: { ...params.optics, vignette: value } }),
    },
    {
      key: 'chromatic',
      label: 'CHROMATIC',
      value: params.optics.chromatic,
      min: 0,
      max: 100,
      onChange: (value) => onChange({ ...params, optics: { ...params.optics, chromatic: value } }),
    },
    {
      key: 'edgeBlur',
      label: 'EDGE BLUR',
      value: params.optics.edgeBlur,
      min: 0,
      max: 100,
      onChange: (value) => onChange({ ...params, optics: { ...params.optics, edgeBlur: value } }),
    },
  ]

  const setFocal = (focalMm: FocalMm) =>
    onChange({ ...params, optics: { ...params.optics, focalMm } })

  return (
    <ControlGroup controls={controls}>
      <div className="group__toggles" role="radiogroup" aria-label="Focal">
        {FOCAL_OPTIONS.map((focal) => (
          <button
            key={focal}
            type="button"
            role="radio"
            aria-checked={params.optics.focalMm === focal}
            className={
              params.optics.focalMm === focal ? 'group__toggle group__toggle--on' : 'group__toggle'
            }
            onClick={() => setFocal(focal)}
          >
            {focal} mm
          </button>
        ))}
      </div>
    </ControlGroup>
  )
}
