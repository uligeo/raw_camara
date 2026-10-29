type ImageCaptureLike = { takePhoto(): Promise<Blob> }
type ImageCaptureCtor = new (track: MediaStreamTrack) => ImageCaptureLike

export type Captured = { bitmap: ImageBitmap; width: number; height: number }

async function fromTrack(track: MediaStreamTrack): Promise<Captured | null> {
  const ctor = (globalThis as { ImageCapture?: ImageCaptureCtor }).ImageCapture
  if (!ctor) return null
  try {
    const blob = await new ctor(track).takePhoto()
    const bitmap = await createImageBitmap(blob)
    return { bitmap, width: bitmap.width, height: bitmap.height }
  } catch {
    return null
  }
}

async function fromVideo(video: HTMLVideoElement): Promise<Captured> {
  const width = video.videoWidth || video.clientWidth
  const height = video.videoHeight || video.clientHeight
  const bitmap = await createImageBitmap(video)
  return { bitmap, width, height }
}

export async function capture(
  stream: MediaStream | null,
  video: HTMLVideoElement,
): Promise<Captured> {
  const track = stream?.getVideoTracks()[0]
  if (track) {
    const photo = await fromTrack(track)
    if (photo) return photo
  }
  return fromVideo(video)
}
