import { http, HttpResponse } from 'msw'

// Baseline MSW handlers for the Phase 1 test bootstrap. `lib/api.ts` calls
// are same-origin relative paths (`/api/v1/...`), matching what the browser
// sends once `next.config.ts` rewrites are in place.
//
// Auth-flow handlers (login/register/forgot/reset-password) land in Phase 2
// alongside `contexts/AuthContext.tsx` and the auth pages that exercise them.
//
// `GET /api/v1/carteras` (Phase 3) defaults to a single cartera so specs
// that don't care about cartera selection still render normally; tests that
// do care override it per-test with `server.use(...)`.
export const handlers = [
  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'demo@example.com',
      nombre: 'Demo',
      created_at: '2024-01-01T00:00:00Z',
    })
  }),

  http.get('/api/v1/carteras', () => {
    return HttpResponse.json([
      { id: 1, nombre: 'Cartera principal', created_at: '2024-01-01T00:00:00Z' },
    ])
  }),
]
