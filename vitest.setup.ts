import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './test/mocks/server'

// Starts the MSW node server for the whole run, resets handlers between
// tests, and shuts it down at the end. Individual tests add per-test
// handlers via `server.use(...)` when they need custom responses.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  window.localStorage.clear()
})
afterAll(() => server.close())

// Node 22+'s built-in experimental `localStorage` global shadows jsdom's
// functional `window.localStorage` (it no-ops without `--localstorage-file`),
// leaving `window.localStorage` `undefined` in this Node/jsdom/vitest
// combination (confirmed: Node v26). `contexts/CarteraContext.tsx` persists
// the active cartera in `localStorage`, so tests need a real implementation
// — install a minimal in-memory polyfill.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() { return this.store.size }
  clear() { this.store.clear() }
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null }
  removeItem(key: string) { this.store.delete(key) }
  setItem(key: string, value: string) { this.store.set(key, String(value)) }
}

if (typeof window !== 'undefined' && !window.localStorage) {
  Object.defineProperty(window, 'localStorage', {
    value: new MemoryStorage(),
    writable: true,
    configurable: true,
  })
}
