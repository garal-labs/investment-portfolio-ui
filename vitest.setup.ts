import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './test/mocks/server'

// Starts the MSW node server for the whole run, resets handlers between
// tests, and shuts it down at the end. Individual tests add per-test
// handlers via `server.use(...)` when they need custom responses.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
