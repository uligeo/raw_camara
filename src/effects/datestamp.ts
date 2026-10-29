export const STAMP_COLOR = '#ff7a18'

export function stampText(createdAt: number): string {
  const d = new Date(createdAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = pad(d.getFullYear() % 100)
  return `${pad(d.getDate())} ${pad(d.getMonth() + 1)} '${year} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function stampFontSize(width: number, height: number): number {
  return Math.max(10, Math.round(Math.min(width, height) * 0.045))
}

export function drawDateStamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
): void {
  const size = stampFontSize(width, height)
  const margin = Math.round(size * 0.9)
  ctx.save()
  ctx.font = `${size}px "DateStamp", "Courier New", monospace`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(255, 122, 24, 0.55)'
  ctx.shadowBlur = size * 0.5
  ctx.fillStyle = STAMP_COLOR
  ctx.fillText(text, width - margin, height - margin)
  ctx.restore()
}
