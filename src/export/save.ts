export function shotFilename(createdAt: number): string {
  const d = new Date(createdAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `RAW_${date}_${time}.jpg`
}

export function supportsFileShare(file: File): boolean {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  return typeof nav.share === 'function' && nav.canShare?.({ files: [file] }) === true
}

export async function saveImage(
  blob: Blob,
  filename: string,
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
  if (supportsFileShare(file)) {
    try {
      await navigator.share({ files: [file] })
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') throw error
    }
    return 'shared'
  }
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
