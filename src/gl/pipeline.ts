import { createProgram, createQuad, createTexture } from './program'

export type UniformValue = number | number[] | WebGLTexture

export type Pass = {
  program: WebGLProgram
  uniforms: Record<string, UniformValue>
}

type Target = { framebuffer: WebGLFramebuffer; texture: WebGLTexture; w: number; h: number }

export class Pipeline {
  private quad: WebGLBuffer
  private source: WebGLTexture
  private targets: Target[] = []
  private programs = new Map<string, WebGLProgram>()
  private width = 1
  private height = 1
  private disposed = false

  constructor(private gl: WebGLRenderingContext) {
    this.quad = createQuad(gl)
    this.source = createTexture(gl)
  }

  program(fragmentSource: string): WebGLProgram {
    const cached = this.programs.get(fragmentSource)
    if (cached) return cached
    const program = createProgram(this.gl, fragmentSource)
    this.programs.set(fragmentSource, program)
    return program
  }

  setSource(image: TexImageSource, width: number, height: number): void {
    const { gl } = this
    this.width = width
    this.height = height
    gl.bindTexture(gl.TEXTURE_2D, this.source)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
  }

  private target(index: number): Target {
    const { gl } = this
    const existing = this.targets[index]
    if (existing && existing.w === this.width && existing.h === this.height) return existing
    if (existing) {
      gl.deleteFramebuffer(existing.framebuffer)
      gl.deleteTexture(existing.texture)
    }
    const texture = createTexture(gl)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.width,
      this.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    )
    const framebuffer = gl.createFramebuffer()
    if (!framebuffer) throw new Error('No se pudo crear el framebuffer.')
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    const created = { framebuffer, texture, w: this.width, h: this.height }
    this.targets[index] = created
    return created
  }

  private draw(pass: Pass, input: WebGLTexture, output: Target | null): void {
    const { gl } = this
    gl.useProgram(pass.program)
    gl.bindFramebuffer(gl.FRAMEBUFFER, output ? output.framebuffer : null)
    gl.viewport(0, 0, this.width, this.height)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, input)
    gl.uniform1i(gl.getUniformLocation(pass.program, 'uImage'), 0)
    gl.uniform2f(gl.getUniformLocation(pass.program, 'uResolution'), this.width, this.height)
    gl.uniform2f(
      gl.getUniformLocation(pass.program, 'uTexel'),
      1 / this.width,
      1 / this.height,
    )

    let unit = 1
    for (const [name, value] of Object.entries(pass.uniforms)) {
      const location = gl.getUniformLocation(pass.program, name)
      if (!location) continue
      if (typeof value === 'number') {
        gl.uniform1f(location, value)
      } else if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2fv(location, value)
        else if (value.length === 3) gl.uniform3fv(location, value)
        else gl.uniform4fv(location, value)
      } else {
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, value)
        gl.uniform1i(location, unit)
        unit += 1
      }
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  render(passes: Pass[]): void {
    const { gl } = this
    gl.canvas.width = this.width
    gl.canvas.height = this.height
    if (passes.length === 0) {
      this.draw({ program: this.program(COPY_FRAGMENT), uniforms: {} }, this.source, null)
      return
    }
    let input = this.source
    passes.forEach((pass, index) => {
      const last = index === passes.length - 1
      const output = last ? null : this.target(index % 2)
      this.draw(pass, input, output)
      if (!last && output) input = output.texture
    })
  }

  async readBlob(quality = 0.92): Promise<Blob> {
    const canvas = this.gl.canvas as HTMLCanvasElement
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) throw new Error('No se pudo exportar la imagen.')
    return blob
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    const { gl } = this
    for (const target of this.targets) {
      gl.deleteFramebuffer(target.framebuffer)
      gl.deleteTexture(target.texture)
    }
    this.targets = []
    for (const program of this.programs.values()) gl.deleteProgram(program)
    this.programs.clear()
    gl.deleteTexture(this.source)
    gl.deleteBuffer(this.quad)
  }
}

export const COPY_FRAGMENT = `
precision mediump float;
uniform sampler2D uImage;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(uImage, vUv);
}
`
