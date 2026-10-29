import { outputSize, rotatedBounds } from '../crop/geometry'
import { drawDateStamp, stampText } from '../effects/datestamp'
import type { EditParams } from '../types'

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D.')
  return ctx
}

export function compose(
  source: HTMLCanvasElement,
  params: EditParams,
  createdAt: number,
): HTMLCanvasElement {
  const { rotation, mirror, rect } = params.crop
  const bounds = rotatedBounds(source.width, source.height, rotation)

  const rotated = document.createElement('canvas')
  rotated.width = bounds.w
  rotated.height = bounds.h
  const rctx = context(rotated)
  rctx.translate(bounds.w / 2, bounds.h / 2)
  rctx.rotate((rotation * Math.PI) / 180)
  if (mirror) rctx.scale(-1, 1)
  rctx.drawImage(source, -source.width / 2, -source.height / 2)

  const size = outputSize({ w: source.width, h: source.height }, rect, rotation)
  const output = document.createElement('canvas')
  output.width = size.w
  output.height = size.h
  const octx = context(output)
  octx.drawImage(
    rotated,
    rect.x * bounds.w,
    rect.y * bounds.h,
    rect.w * bounds.w,
    rect.h * bounds.h,
    0,
    0,
    size.w,
    size.h,
  )

  if (params.effects.dateStamp) {
    drawDateStamp(octx, stampText(createdAt), size.w, size.h)
  }
  return output
}
