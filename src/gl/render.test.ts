import { describe, expect, test } from 'vitest'
import { MAX_OUTPUT_EDGE, fitToTextureLimit } from './render'

function glWithLimit(limit: number): WebGLRenderingContext {
  return { MAX_TEXTURE_SIZE: 0x0d33, getParameter: () => limit } as unknown as WebGLRenderingContext
}

describe('limite de textura', () => {
  test('una imagen dentro del limite no se toca', () => {
    expect(fitToTextureLimit(glWithLimit(4096), 3000, 2000)).toEqual({ w: 3000, h: 2000 })
  })

  test('una imagen mayor que el limite se reescala en lugar de fallar', () => {
    expect(fitToTextureLimit(glWithLimit(1024), 6000, 4000)).toEqual({ w: 1024, h: 683 })
  })

  test('el lado mayor nunca supera el tope de salida', () => {
    const size = fitToTextureLimit(glWithLimit(16384), 12000, 9000)
    expect(Math.max(size.w, size.h)).toBe(MAX_OUTPUT_EDGE)
  })

  test('un limite no numerico cae a 4096', () => {
    const gl = { getParameter: () => null } as unknown as WebGLRenderingContext
    expect(Math.max(...Object.values(fitToTextureLimit(gl, 9000, 9000)))).toBe(4096)
  })
})
