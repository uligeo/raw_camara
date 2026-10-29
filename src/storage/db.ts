import { openDB, type IDBPDatabase } from 'idb'
import type { EditParams } from '../types'

export type Shot = {
  id: string
  createdAt: number
  original: Blob
  params: EditParams
}

type StoredShot = {
  id: string
  createdAt: number
  buffer: ArrayBuffer
  type: string
  params: EditParams
}

const DB_NAME = 'raw-camara'
const STORE = 'shots'

let connection: Promise<IDBPDatabase | null> | null = null

function connect(): Promise<IDBPDatabase | null> {
  if (connection) return connection
  connection = (async () => {
    if (typeof indexedDB === 'undefined') return null
    try {
      return await openDB(DB_NAME, 1, {
        upgrade(db) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' })
          store.createIndex('createdAt', 'createdAt')
        },
      })
    } catch {
      return null
    }
  })()
  return connection
}

export function resetConnection(): void {
  connection = null
}

export async function isPersistenceAvailable(): Promise<boolean> {
  return (await connect()) !== null
}

export async function saveShot(shot: Shot): Promise<void> {
  const db = await connect()
  if (!db) return
  try {
    const stored: StoredShot = {
      id: shot.id,
      createdAt: shot.createdAt,
      buffer: await shot.original.arrayBuffer(),
      type: shot.original.type || 'image/jpeg',
      params: shot.params,
    }
    await db.put(STORE, stored)
  } catch {
    return
  }
}

export async function loadShots(): Promise<Shot[]> {
  const db = await connect()
  if (!db) return []
  try {
    const stored = (await db.getAll(STORE)) as StoredShot[]
    return stored
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        params: s.params,
        original: new Blob([s.buffer], { type: s.type }),
      }))
  } catch {
    return []
  }
}

export async function deleteShot(id: string): Promise<void> {
  const db = await connect()
  if (!db) return
  try {
    await db.delete(STORE, id)
  } catch {
    return
  }
}
