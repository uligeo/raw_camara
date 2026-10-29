import type { EditParams } from '../types'
import { compose } from './compose'
import { createContext, maxTextureSize } from './context'
import { buildPasses } from './passes'
import { Pipeline } from './pipeline'

export const MAX_OUTPUT_EDGE = 4096

export function fitToTextureLimit(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
): { w: number; h: number } {
  const limit = Math.min(maxTextureSize(gl), MAX_OUTPUT_EDGE)
  const longest = Math.max(width, height)
  if (longest <= limit) return { w: width, h: height }
  const scale = limit / longest
  return { w: Math.round(width * scale), h: Math.round(height * scale) }
}

export class ImageRenderer {
  readonly canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private pipeline: Pipeline

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas ?? document.createElement('canvas')
    this.gl = createContext(this.canvas)
    this.pipeline = new Pipeline(this.gl)
  }

  async draw(
    source: TexImageSource,
    width: number,
    height: number,
    params: EditParams,
    options: { live?: boolean } = {},
  ): Promise<void> {
    const size = fitToTextureLimit(this.gl, width, height)
    this.pipeline.setSource(source, size.w, size.h)
    const passes = await buildPasses(this.pipeline, this.gl, params, options)
    this.pipeline.render(passes)
  }

  composed(params: EditParams, createdAt: number): HTMLCanvasElement {
    return compose(this.canvas, params, createdAt)
  }

  async toBlob(params: EditParams, createdAt: number, quality = 0.92): Promise<Blob> {
    const output = this.composed(params, createdAt)
    const blob = await new Promise<Blob | null>((resolve) =>
      output.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) throw new Error('No se pudo exportar la imagen.')
    return blob
  }

  dispose(): void {
    this.pipeline.dispose()
  }
}

export async function renderFull(
  source: TexImageSource,
  width: number,
  height: number,
  params: EditParams,
  createdAt: number,
): Promise<Blob> {
  const renderer = new ImageRenderer()
  try {
    await renderer.draw(source, width, height, params)
    return await renderer.toBlob(params, createdAt)
  } finally {
    renderer.dispose()
  }
}
