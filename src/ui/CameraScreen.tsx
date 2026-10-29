import { useEffect, useRef, useState } from 'react'
import { CAMERA_MESSAGES, useCamera } from '../camera/useCamera'
import { capture, type Captured } from '../camera/capture'
import { FILMS, filmById } from '../films/catalog'
import { PreviewRenderer } from '../gl/preview'
import { applyFilm, DEFAULT_PARAMS } from '../state/params'
import type { EditParams, Film } from '../types'
import { FilmStrip } from './FilmStrip'
import { RulerSlider } from './RulerSlider'
import './CameraScreen.css'

type Props = {
  onCaptured: (shot: Captured, params: EditParams, viewportAspect: number) => void
}

export function CameraScreen({ onCaptured }: Props) {
  const { stream, error, flip, retry } = useCamera()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<PreviewRenderer | null>(null)
  const [params, setParams] = useState<EditParams>(() => applyFilm(DEFAULT_PARAMS, FILMS[0]))
  const [busy, setBusy] = useState(false)
  const [glError, setGlError] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      rendererRef.current = new PreviewRenderer(canvas)
    } catch {
      setGlError(true)
      return
    }
    return () => {
      rendererRef.current?.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    void rendererRef.current?.setParams(params)
  }, [params])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return
    video.srcObject = stream
    const play = async () => {
      try {
        await video.play()
        rendererRef.current?.start(video)
      } catch {
        return
      }
    }
    void play()
    return () => rendererRef.current?.stop()
  }, [stream])

  const selectFilm = (film: Film) => setParams((current) => applyFilm(current, film))

  const shoot = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || busy) return
    setBusy(true)
    try {
      const shot = await capture(stream, video)
      const aspect = canvas ? canvas.clientWidth / canvas.clientHeight : shot.width / shot.height
      onCaptured(shot, params, aspect)
    } finally {
      setBusy(false)
    }
  }

  if (error !== 'none' || glError) {
    return (
      <section className="camera camera--error">
        <p className="camera__message">
          {glError
            ? 'Este dispositivo no puede procesar imagenes con WebGL.'
            : CAMERA_MESSAGES[error as Exclude<typeof error, 'none'>]}
        </p>
        {!glError ? (
          <button type="button" className="camera__retry" onClick={retry}>
            Reintentar
          </button>
        ) : null}
      </section>
    )
  }

  return (
    <section className="camera">
      <div className="camera__viewport">
        <video ref={videoRef} playsInline muted className="camera__video" />
        <canvas ref={canvasRef} className="camera__canvas" />
      </div>

      <div className="camera__controls">
        <FilmStrip films={FILMS} selectedId={params.film.filmId} onSelect={selectFilm} />
        <RulerSlider
          label="EXPOSURE"
          value={params.light.exposure}
          onChange={(value) =>
            setParams((current) => ({ ...current, light: { ...current.light, exposure: value } }))
          }
        />
        <div className="camera__actions">
          <span className="camera__film">{filmById(params.film.filmId).name.toUpperCase()}</span>
          <button
            type="button"
            className="camera__shutter"
            aria-label="Disparar"
            onClick={shoot}
            disabled={busy}
          />
          <button type="button" className="camera__flip" aria-label="Cambiar camara" onClick={flip}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                d="M4 8h10l-3-3M20 16H10l3 3"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
