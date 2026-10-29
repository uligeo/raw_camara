import { beforeEach, describe, expect, test, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { DEFAULT_PARAMS } from '../state/params'
import {
  deleteShot,
  isPersistenceAvailable,
  loadShots,
  resetConnection,
  saveShot,
  type Shot,
} from './db'

function shot(id: string, createdAt: number): Shot {
  return {
    id,
    createdAt,
    original: new Blob(['x'], { type: 'image/jpeg' }),
    params: DEFAULT_PARAMS,
  }
}

describe('persistencia de capturas', () => {
  beforeEach(async () => {
    resetConnection()
    for (const s of await loadShots()) await deleteShot(s.id)
  })

  test('guardar y recuperar conserva los parametros y el blob', async () => {
    await saveShot(shot('a', 1))
    const [loaded] = await loadShots()
    expect(loaded.id).toBe('a')
    expect(loaded.params.optics.focalMm).toBe(35)
    expect(loaded.original).toBeInstanceOf(Blob)
  })

  test('loadShots devuelve las capturas de mas reciente a mas antigua', async () => {
    await saveShot(shot('vieja', 1))
    await saveShot(shot('nueva', 3))
    await saveShot(shot('media', 2))
    expect((await loadShots()).map((s) => s.id)).toEqual(['nueva', 'media', 'vieja'])
  })

  test('sin IndexedDB la app no se rompe', async () => {
    resetConnection()
    vi.stubGlobal('indexedDB', undefined)
    await expect(saveShot(shot('a', 1))).resolves.toBeUndefined()
    await expect(loadShots()).resolves.toEqual([])
    await expect(isPersistenceAvailable()).resolves.toBe(false)
    vi.unstubAllGlobals()
    resetConnection()
  })
})
