import { createTexture } from '../gl/program'

const cache = new WeakMap<WebGLRenderingContext, Map<string, WebGLTexture>>()

function imagesFor(gl: WebGLRenderingContext): Map<string, WebGLTexture> {
  const existing = cache.get(gl)
  if (existing) return existing
  const created = new Map<string, WebGLTexture>()
  cache.set(gl, created)
  return created
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar ${url}`))
    image.src = url
  })
}

export async function loadTexture(
  gl: WebGLRenderingContext,
  url: string,
): Promise<WebGLTexture> {
  const store = imagesFor(gl)
  const cached = store.get(url)
  if (cached) return cached
  const image = await loadImage(url)
  const texture = createTexture(gl)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  store.set(url, texture)
  return texture
}
