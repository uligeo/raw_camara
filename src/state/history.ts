export const HISTORY_LIMIT = 50

export class History<T> {
  private past: T[] = []
  private future: T[] = []

  constructor(private current: T) {}

  get value(): T {
    return this.current
  }

  get canUndo(): boolean {
    return this.past.length > 0
  }

  get canRedo(): boolean {
    return this.future.length > 0
  }

  push(state: T): void {
    this.past.push(this.current)
    if (this.past.length > HISTORY_LIMIT) this.past.shift()
    this.current = state
    this.future = []
  }

  undo(): T | null {
    const previous = this.past.pop()
    if (previous === undefined) return null
    this.future.push(this.current)
    this.current = previous
    return this.current
  }

  redo(): T | null {
    const next = this.future.pop()
    if (next === undefined) return null
    this.past.push(this.current)
    this.current = next
    return this.current
  }
}
