export class GLUnavailableError extends Error {
  constructor() {
    super('Este dispositivo no puede procesar imagenes con WebGL.')
    this.name = 'GLUnavailableError'
  }
}

export function createContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
  const options: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
    premultipliedAlpha: false,
  }
  const gl =
    (canvas.getContext('webgl', options) as WebGLRenderingContext | null) ??
    (canvas.getContext('experimental-webgl', options) as WebGLRenderingContext | null)
  if (!gl) throw new GLUnavailableError()
  return gl
}

export function onContextLost(canvas: HTMLCanvasElement, handler: () => void): () => void {
  const listener = (event: Event) => {
    event.preventDefault()
    handler()
  }
  canvas.addEventListener('webglcontextlost', listener)
  return () => canvas.removeEventListener('webglcontextlost', listener)
}

export function maxTextureSize(gl: WebGLRenderingContext): number {
  const size = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
  return typeof size === 'number' && size > 0 ? size : 4096
}
