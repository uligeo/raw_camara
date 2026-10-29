import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraError = 'none' | 'denied' | 'busy' | 'unsupported' | 'unknown'

export type Facing = 'environment' | 'user'

export const CAMERA_MESSAGES: Record<Exclude<CameraError, 'none'>, string> = {
  denied:
    'No hay permiso para usar la camara. Activalo en los ajustes del navegador y vuelve a intentarlo.',
  busy: 'Otra aplicacion esta usando la camara. Cierrala y vuelve a intentarlo.',
  unsupported:
    'Este navegador no puede abrir la camara. Abre la aplicacion en Safari o en Chrome sobre HTTPS.',
  unknown: 'No se pudo abrir la camara. Vuelve a intentarlo.',
}

export function cameraErrorFrom(error: unknown): Exclude<CameraError, 'none'> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) return 'unsupported'
  const name = (error as { name?: string })?.name
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'busy'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'unsupported'
  return 'unknown'
}

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facing, setFacing] = useState<Facing>('environment')
  const [error, setError] = useState<CameraError>('none')
  const [attempt, setAttempt] = useState(0)
  const current = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    const stop = () => {
      current.current?.getTracks().forEach((track) => track.stop())
      current.current = null
    }

    async function open() {
      stop()
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setError('unsupported')
        return
      }
      try {
        const next = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 4096 }, height: { ideal: 4096 } },
          audio: false,
        })
        if (cancelled) {
          next.getTracks().forEach((track) => track.stop())
          return
        }
        current.current = next
        setStream(next)
        setError('none')
      } catch (caught) {
        if (cancelled) return
        setStream(null)
        setError(cameraErrorFrom(caught))
      }
    }

    void open()
    return () => {
      cancelled = true
      stop()
    }
  }, [facing, attempt])

  const flip = useCallback(() => {
    setFacing((value) => (value === 'environment' ? 'user' : 'environment'))
  }, [])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  return { stream, facing, error, flip, retry }
}
