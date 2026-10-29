import type { Aspect, CropRect } from '../types'

const MIN_SIZE = 0.05

export const ASPECT_RATIOS: Record<Exclude<Aspect, 'free'>, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
  '16:9': 16 / 9,
}

export function clampRect(rect: CropRect): CropRect {
  const w = Math.min(1, Math.max(MIN_SIZE, rect.w))
  const h = Math.min(1, Math.max(MIN_SIZE, rect.h))
  return {
    w,
    h,
    x: Math.min(1 - w, Math.max(0, rect.x)),
    y: Math.min(1 - h, Math.max(0, rect.y)),
  }
}

export function fitRatio(rect: CropRect, targetRatio: number, imageAspect: number): CropRect {
  const ratio = targetRatio / imageAspect
  const w = ratio >= 1 ? 1 : ratio
  const h = ratio >= 1 ? 1 / ratio : 1
  const cx = rect.x + rect.w / 2
  const cy = rect.y + rect.h / 2
  return clampRect({ x: cx - w / 2, y: cy - h / 2, w, h })
}

export function fitAspect(rect: CropRect, aspect: Aspect, imageAspect: number): CropRect {
  if (aspect === 'free') return clampRect(rect)
  return fitRatio(rect, ASPECT_RATIOS[aspect], imageAspect)
}

export function rotatedBounds(w: number, h: number, degrees: number): { w: number; h: number } {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  return {
    w: Math.round(w * cos + h * sin),
    h: Math.round(w * sin + h * cos),
  }
}

export function outputSize(
  image: { w: number; h: number },
  rect: CropRect,
  rotation: number,
): { w: number; h: number } {
  const bounds = rotatedBounds(image.w, image.h, rotation)
  return {
    w: Math.max(1, Math.round(bounds.w * rect.w)),
    h: Math.max(1, Math.round(bounds.h * rect.h)),
  }
}
