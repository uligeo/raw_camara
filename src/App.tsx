import { useEffect, useState } from 'react'
import type { Captured } from './camera/capture'
import { fitRatio } from './crop/geometry'
import { deleteShot, loadShots, saveShot } from './storage/db'
import { CameraScreen } from './ui/CameraScreen'
import { EditorScreen } from './ui/EditorScreen'
import type { EditParams } from './types'
import './ui/App.css'

type Session = { shot: Captured; createdAt: number; params: EditParams }

const PENDING_ID = 'pending'

export function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function restore() {
      const [stored] = await loadShots()
      if (!stored || cancelled) return
      try {
        const bitmap = await createImageBitmap(stored.original)
        if (cancelled) return
        setSession({
          shot: { bitmap, width: bitmap.width, height: bitmap.height },
          createdAt: stored.createdAt,
          params: stored.params,
        })
      } catch {
        await deleteShot(stored.id)
      }
    }
    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCaptured = async (
    shot: Captured,
    params: EditParams,
    viewportAspect: number,
  ) => {
    const createdAt = Date.now()
    const framed: EditParams = {
      ...params,
      crop: {
        ...params.crop,
        rect: fitRatio(params.crop.rect, viewportAspect, shot.width / shot.height),
      },
    }
    setSession({ shot, createdAt, params: framed })
    const canvas = document.createElement('canvas')
    canvas.width = shot.width
    canvas.height = shot.height
    canvas.getContext('2d')?.drawImage(shot.bitmap, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) void saveShot({ id: PENDING_ID, createdAt, original: blob, params: framed })
    }, 'image/jpeg', 0.95)
  }

  const discard = async () => {
    setConfirming(false)
    setSession(null)
    await deleteShot(PENDING_ID)
  }

  if (!session) {
    return <CameraScreen onCaptured={(shot, params, aspect) => void handleCaptured(shot, params, aspect)} />
  }

  return (
    <>
      <EditorScreen
        shot={session.shot}
        createdAt={session.createdAt}
        initialParams={session.params}
        onClose={() => setConfirming(true)}
        onSaved={() => void discard()}
      />
      {confirming ? (
        <div className="confirm" role="dialog" aria-label="Descartar captura">
          <p className="confirm__text">Se perdera esta captura.</p>
          <div className="confirm__actions">
            <button type="button" className="confirm__cancel" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
            <button type="button" className="confirm__discard" onClick={() => void discard()}>
              Descartar
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
