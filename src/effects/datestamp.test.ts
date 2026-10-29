import { describe, expect, test, vi } from 'vitest'
import { drawDateStamp, stampFontSize, stampText } from './datestamp'

describe('sello de fecha', () => {
  test('usa el formato de fecha de la referencia', () => {
    expect(stampText(new Date(2026, 9, 29, 17, 23).getTime())).toBe("29 10 '26 17:23")
  })

  test('rellena con ceros los valores de un digito', () => {
    expect(stampText(new Date(2026, 0, 2, 3, 4).getTime())).toBe("02 01 '26 03:04")
  })

  test('el tamano del texto escala con el lado menor', () => {
    expect(stampFontSize(4000, 3000)).toBeGreaterThan(stampFontSize(800, 600))
    expect(stampFontSize(40, 30)).toBeGreaterThanOrEqual(10)
  })

  test('el sello se dibuja dentro del lienzo', () => {
    const calls: Array<[string, number, number]> = []
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillText: (t: string, x: number, y: number) => calls.push([t, x, y]),
      font: '',
      textAlign: '',
      textBaseline: '',
      shadowColor: '',
      shadowBlur: 0,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D
    drawDateStamp(ctx, "29 10 '26 17:23", 1000, 800)
    const [, x, y] = calls[0]
    expect(x).toBeLessThan(1000)
    expect(x).toBeGreaterThan(0)
    expect(y).toBeLessThan(800)
    expect(y).toBeGreaterThan(0)
  })
})
