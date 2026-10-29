import { afterEach, describe, expect, test, vi } from 'vitest'
import { CAMERA_MESSAGES, cameraErrorFrom } from './useCamera'

const named = (name: string) => Object.assign(new Error('x'), { name })

afterEach(() => vi.unstubAllGlobals())

describe('errores de camara', () => {
  test('el permiso denegado se traduce a un mensaje accionable', () => {
    vi.stubGlobal('navigator', { mediaDevices: {} })
    expect(cameraErrorFrom(named('NotAllowedError'))).toBe('denied')
    expect(CAMERA_MESSAGES.denied).toMatch(/permiso/i)
  })

  test('la camara ocupada se distingue del permiso denegado', () => {
    vi.stubGlobal('navigator', { mediaDevices: {} })
    expect(cameraErrorFrom(named('NotReadableError'))).toBe('busy')
    expect(CAMERA_MESSAGES.busy).toMatch(/aplicacion/i)
  })

  test('un navegador sin mediaDevices se reporta como no soportado', () => {
    vi.stubGlobal('navigator', {})
    expect(cameraErrorFrom(named('NotAllowedError'))).toBe('unsupported')
  })

  test('todo codigo de error tiene mensaje', () => {
    vi.stubGlobal('navigator', { mediaDevices: {} })
    for (const name of ['NotAllowedError', 'NotReadableError', 'NotFoundError', 'Boom']) {
      expect(CAMERA_MESSAGES[cameraErrorFrom(named(name))]).toBeTruthy()
    }
  })
})
