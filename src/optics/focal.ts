import type { FocalMm } from '../types'

export const FOCAL_OPTIONS: FocalMm[] = [24, 28, 35, 50, 85]

export const BASE_FOCAL = 35

export function focalTransform(focalMm: number): { zoom: number; barrel: number } {
  if (focalMm === BASE_FOCAL) return { zoom: 1, barrel: 0 }
  if (focalMm < BASE_FOCAL) {
    const wide = (BASE_FOCAL - focalMm) / BASE_FOCAL
    return { zoom: 1 + wide * 0.35, barrel: wide * 0.55 }
  }
  return { zoom: focalMm / BASE_FOCAL, barrel: 0 }
}
