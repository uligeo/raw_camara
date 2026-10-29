import { afterEach, describe, expect, test, vi } from 'vitest'
import { saveImage, shotFilename } from './save'

const blob = new Blob(['x'], { type: 'image/jpeg' })

afterEach(() => vi.unstubAllGlobals())

describe('guardado', () => {
  test('usa compartir cuando el dispositivo lo permite', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share, canShare: () => true })
    await expect(saveImage(blob, 'a.jpg')).resolves.toBe('shared')
    expect(share).toHaveBeenCalled()
  })

  test('cae a la descarga cuando no hay compartir de archivos', async () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:x', revokeObjectURL: () => {} })
    await expect(saveImage(blob, 'a.jpg')).resolves.toBe('downloaded')
  })

  test('cancelar la hoja de compartir no se trata como fallo', async () => {
    const share = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' }))
    vi.stubGlobal('navigator', { share, canShare: () => true })
    await expect(saveImage(blob, 'a.jpg')).resolves.toBe('shared')
  })

  test('shotFilename rellena con ceros', () => {
    expect(shotFilename(new Date(2026, 0, 2, 3, 4, 5).getTime())).toBe('RAW_20260102_030405.jpg')
  })
})
