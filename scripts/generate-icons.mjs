import { mkdirSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const OUT = new URL('../public/icons/', import.meta.url)
const ACCENT = [255, 214, 10]

function icon(size, padding) {
  const png = new PNG({ width: size, height: size })
  const center = size / 2
  const outer = center * (1 - padding)
  const inner = outer * 0.52
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const d = Math.hypot(x - center + 0.5, y - center + 0.5)
      const angle = Math.atan2(y - center, x - center)
      const blade = Math.abs(Math.sin(angle * 3)) * outer * 0.14
      let color = [0, 0, 0]
      if (d < outer && d > inner + blade) color = ACCENT
      else if (d < inner * 0.45) color = ACCENT
      const idx = (y * size + x) * 4
      png.data[idx] = color[0]
      png.data[idx + 1] = color[1]
      png.data[idx + 2] = color[2]
      png.data[idx + 3] = 255
    }
  }
  return PNG.sync.write(png, { colorType: 2 })
}

mkdirSync(OUT, { recursive: true })
for (const [name, size, padding] of [
  ['icon-192.png', 192, 0.18],
  ['icon-512.png', 512, 0.18],
  ['maskable-512.png', 512, 0.3],
]) {
  const buffer = icon(size, padding)
  writeFileSync(new URL(name, OUT), buffer)
  console.log(`${name} ${(buffer.length / 1024).toFixed(0)} KB`)
}
