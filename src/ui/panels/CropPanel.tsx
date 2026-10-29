import { ASPECT_RATIOS, fitAspect } from '../../crop/geometry'
import type { Aspect, EditParams } from '../../types'
import { ControlGroup, type Control } from './ControlGroup'

type Props = {
  params: EditParams
  imageAspect: number
  onChange: (params: EditParams) => void
}

const ASPECTS: Aspect[] = ['free', '1:1', '4:3', '3:2', '16:9']

export function CropPanel({ params, imageAspect, onChange }: Props) {
  const controls: Control[] = [
    {
      key: 'rotation',
      label: 'ROTATE',
      value: params.crop.rotation,
      min: -45,
      max: 45,
      suffix: '°',
      onChange: (value) => onChange({ ...params, crop: { ...params.crop, rotation: value } }),
    },
  ]

  const setAspect = (aspect: Aspect) =>
    onChange({
      ...params,
      crop: { ...params.crop, aspect, rect: fitAspect(params.crop.rect, aspect, imageAspect) },
    })

  const toggleMirror = () =>
    onChange({ ...params, crop: { ...params.crop, mirror: !params.crop.mirror } })

  return (
    <ControlGroup controls={controls}>
      <div className="group__toggles" role="radiogroup" aria-label="Proporcion">
        {ASPECTS.map((aspect) => (
          <button
            key={aspect}
            type="button"
            role="radio"
            aria-checked={params.crop.aspect === aspect}
            className={
              params.crop.aspect === aspect ? 'group__toggle group__toggle--on' : 'group__toggle'
            }
            onClick={() => setAspect(aspect)}
          >
            {aspect === 'free' ? 'FREE' : aspect}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={params.crop.mirror}
          className={params.crop.mirror ? 'group__toggle group__toggle--on' : 'group__toggle'}
          onClick={toggleMirror}
        >
          MIRROR
        </button>
      </div>
    </ControlGroup>
  )
}

export { ASPECT_RATIOS }
