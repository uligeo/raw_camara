import type { EditParams } from '../types'
import { createContext } from './context'
import { buildPasses } from './passes'
import { Pipeline, type Pass } from './pipeline'

const MAX_PIXEL_RATIO = 2

export class PreviewRenderer {
  private gl: WebGLRenderingContext
  private pipeline: Pipeline
  private passes: Pass[] = []
  private frame = 0
  private video: HTMLVideoElement | null = null
  private running = false

  constructor(private canvas: HTMLCanvasElement) {
    this.gl = createContext(canvas)
    this.pipeline = new Pipeline(this.gl)
  }

  get passCount(): number {
    return this.passes.length
  }

  async setParams(params: EditParams): Promise<void> {
    this.passes = await buildPasses(this.pipeline, this.gl, params, { live: true })
  }

  start(video: HTMLVideoElement): void {
    this.video = video
    if (this.running) return
    this.running = true
    const tick = () => {
      if (!this.running) return
      this.frame = requestAnimationFrame(tick)
      this.draw()
    }
    this.frame = requestAnimationFrame(tick)
  }

  private draw(): void {
    const video = this.video
    if (!video || video.readyState < 2) return
    const ratio = Math.min(globalThis.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio))
    const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio))
    try {
      this.pipeline.setSource(video, width, height)
      this.pipeline.render(this.passes)
    } catch {
      this.stop()
    }
  }

  stop(): void {
    this.running = false
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
  }

  dispose(): void {
    this.stop()
    this.pipeline.dispose()
  }
}
