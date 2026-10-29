import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Captured } from '../camera/capture'
import { saveImage, shotFilename } from '../export/save'
import { ImageRenderer } from '../gl/render'
import { History } from '../state/history'
import { clone } from '../state/params'
import type { EditParams } from '../types'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { LightPanel } from './panels/LightPanel'
import { FilmPanel } from './panels/FilmPanel'
import { OpticsPanel } from './panels/OpticsPanel'
import { EffectsPanel } from './panels/EffectsPanel'
import { CropPanel } from './panels/CropPanel'
import './EditorScreen.css'

export const TABS = ['LIGHT', 'FILM', 'OPTICS', 'EFFECTS', 'CROP'] as const

const PREVIEW_INTERVAL = 60

type Props = {
  shot: Captured
  createdAt: number
  initialParams: EditParams
  onClose: () => void
  onSaved: () => void
}

export function EditorScreen({ shot, createdAt, initialParams, onClose, onSaved }: Props) {
  const [params, setParams] = useState(initialParams)
  const [tab, setTab] = useState<string>('FILM')
  const [busy, setBusy] = useState(false)
  const [, bump] = useState(0)
  const history = useRef(new History(initialParams))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<ImageRenderer | null>(null)
  const pending = useRef<number>(0)

  const imageAspect = useMemo(() => shot.width / shot.height, [shot])

  useEffect(() => {
    try {
      rendererRef.current = new ImageRenderer()
    } catch {
      return
    }
    return () => {
      rendererRef.current?.dispose()
      rendererRef.current = null
    }
  }, [])

  const paint = useCallback(async () => {
    const renderer = rendererRef.current
    const target = canvasRef.current
    if (!renderer || !target) return
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 2)
    const maxEdge = Math.max(target.clientWidth, target.clientHeight) * ratio || 1200
    const scale = Math.min(1, maxEdge / Math.max(shot.width, shot.height))
    await renderer.draw(
      shot.bitmap,
      Math.max(1, Math.round(shot.width * scale)),
      Math.max(1, Math.round(shot.height * scale)),
      params,
    )
    const composed = renderer.composed(params, createdAt)
    target.width = composed.width
    target.height = composed.height
    target.getContext('2d')?.drawImage(composed, 0, 0)
  }, [params, shot, createdAt])

  useEffect(() => {
    window.clearTimeout(pending.current)
    pending.current = window.setTimeout(() => void paint(), PREVIEW_INTERVAL)
    return () => window.clearTimeout(pending.current)
  }, [paint])

  const commit = (next: EditParams) => {
    history.current.push(clone(next))
    setParams(next)
    bump((value) => value + 1)
  }

  const undo = () => {
    const previous = history.current.undo()
    if (previous) setParams(previous)
    bump((value) => value + 1)
  }

  const redo = () => {
    const next = history.current.redo()
    if (next) setParams(next)
    bump((value) => value + 1)
  }

  const reset = () => commit(clone(initialParams))

  const save = async () => {
    const renderer = rendererRef.current
    if (!renderer || busy) return
    setBusy(true)
    try {
      await renderer.draw(shot.bitmap, shot.width, shot.height, params)
      const blob = await renderer.toBlob(params, createdAt)
      await saveImage(blob, shotFilename(createdAt))
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  const time = new Date(createdAt).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <section className="editor">
      <Header
        time={time}
        busy={busy}
        canUndo={history.current.canUndo}
        canRedo={history.current.canRedo}
        onClose={onClose}
        onUndo={undo}
        onRedo={redo}
        onReset={reset}
        onSave={() => void save()}
      />

      <div className="editor__stage">
        <canvas ref={canvasRef} className="editor__canvas" />
      </div>

      <div className="editor__panel">
        <TabBar tabs={TABS} active={tab} onSelect={setTab} />
        {tab === 'LIGHT' ? <LightPanel params={params} onChange={commit} /> : null}
        {tab === 'FILM' ? <FilmPanel params={params} onChange={commit} /> : null}
        {tab === 'OPTICS' ? <OpticsPanel params={params} onChange={commit} /> : null}
        {tab === 'EFFECTS' ? <EffectsPanel params={params} onChange={commit} /> : null}
        {tab === 'CROP' ? (
          <CropPanel params={params} imageAspect={imageAspect} onChange={commit} />
        ) : null}
      </div>
    </section>
  )
}
