import { describe, expect, test } from 'vitest'
import { HISTORY_LIMIT, History } from './history'

describe('historial', () => {
  test('deshacer devuelve el estado anterior y rehacer lo recupera', () => {
    const h = new History(0)
    h.push(10)
    h.push(20)
    expect(h.undo()).toBe(10)
    expect(h.redo()).toBe(20)
  })

  test('un cambio nuevo descarta la rama de rehacer', () => {
    const h = new History(0)
    h.push(10)
    h.undo()
    h.push(30)
    expect(h.canRedo).toBe(false)
  })

  test('sin historia no se puede deshacer', () => {
    const h = new History(0)
    expect(h.canUndo).toBe(false)
    expect(h.undo()).toBeNull()
  })

  test('la pila se limita a 50 entradas', () => {
    const h = new History(0)
    for (let i = 1; i <= HISTORY_LIMIT + 10; i += 1) h.push(i)
    for (let i = 0; i < HISTORY_LIMIT; i += 1) h.undo()
    expect(h.canUndo).toBe(false)
    expect(h.value).toBe(10)
  })
})
