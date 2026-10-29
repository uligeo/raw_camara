import { mkdirSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const OUT = new URL('../public/textures/overlays/', import.meta.url)
const clamp = (v) => Math.min(1, Math.max(0, v))

function seeded(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function write(name, size, paint) {
  const png = new PNG({ width: size, height: size })
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = paint(x / (size - 1), y / (size - 1))
      const idx = (y * size + x) * 4
      png.data[idx] = Math.round(clamp(r) * 255)
      png.data[idx + 1] = Math.round(clamp(g) * 255)
      png.data[idx + 2] = Math.round(clamp(b) * 255)
      png.data[idx + 3] = 255
    }
  }
  const buffer = PNG.sync.write(png, { colorType: 2 })
  writeFileSync(new URL(name, OUT), buffer)
  console.log(`${name} ${(buffer.length / 1024).toFixed(0)} KB`)
}

function leak(cx, cy, tint, spread) {
  return (x, y) => {
    const d = Math.hypot((x - cx) / spread, (y - cy) / spread)
    const falloff = Math.pow(Math.max(0, 1 - d), 2.2)
    const streak = Math.pow(Math.max(0, 1 - Math.abs(y - cy) * 2.4), 6) * 0.35
    const value = clamp(falloff + streak * (1 - Math.abs(x - cx)))
    return [value * tint[0], value * tint[1], value * tint[2]]
  }
}

mkdirSync(OUT, { recursive: true })

write('leak-warm.png', 512, leak(1.05, 0.25, [1.0, 0.42, 0.12], 0.95))
write('leak-rose.png', 512, leak(-0.05, 0.72, [1.0, 0.24, 0.42], 0.85))
write('leak-gold.png', 512, leak(0.5, -0.1, [1.0, 0.72, 0.2], 1.15))

const flareRandom = seeded(99)
const rays = Array.from({ length: 14 }, () => flareRandom() * Math.PI * 2)
write('flare.png', 512, (x, y) => {
  const dx = x - 0.32
  const dy = y - 0.28
  const d = Math.hypot(dx, dy)
  const core = Math.pow(Math.max(0, 1 - d * 3.2), 3)
  const angle = Math.atan2(dy, dx)
  let spikes = 0
  for (const ray of rays) {
    spikes += Math.pow(Math.max(0, 1 - Math.abs(Math.sin((angle - ray) * 0.5))), 90)
  }
  const value = clamp(core + spikes * Math.max(0, 1 - d * 2.2) * 0.5)
  return [value, value * 0.86, value * 0.6]
})

const dustRandom = seeded(7)
const specks = Array.from({ length: 900 }, () => ({
  x: dustRandom(),
  y: dustRandom(),
  r: 0.0008 + dustRandom() * 0.0035,
  v: 0.3 + dustRandom() * 0.7,
}))
const scratches = Array.from({ length: 22 }, () => ({
  x: dustRandom(),
  w: 0.0006 + dustRandom() * 0.0016,
  top: dustRandom() * 0.5,
  bottom: 0.5 + dustRandom() * 0.5,
  v: 0.25 + dustRandom() * 0.55,
}))
write('dust.png', 1024, (x, y) => {
  let value = 0
  for (const s of specks) {
    const d = Math.hypot(x - s.x, y - s.y)
    if (d < s.r) value = Math.max(value, s.v * (1 - d / s.r))
  }
  for (const s of scratches) {
    if (y >= s.top && y <= s.bottom && Math.abs(x - s.x) < s.w) {
      value = Math.max(value, s.v * (1 - Math.abs(x - s.x) / s.w))
    }
  }
  return [value, value, value]
})
