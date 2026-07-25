import axios from 'axios'
import type {
  Cartera, CarteraCreate,
  Movimiento, MovimientoCreate,
  ResumenCartera, AnalisisCartera,
  Instrumento, InstrumentoUpdate,
  User, LoginPayload, RegisterPayload, ResetPasswordPayload,
} from '@/types'

// Relative baseURL: the browser calls same-origin `/api/v1/*`, and
// `next.config.ts` rewrites proxy that to the backend server-side. No
// `withCredentials` needed — same-origin requests already carry cookies.
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  login: (data: LoginPayload) =>
    api.post('/auth/login', data).then(r => r.data),

  register: (data: RegisterPayload) =>
    api.post('/auth/register', data).then(r => r.data),

  logout: () =>
    api.post('/auth/logout').then(r => r.data),

  me: () =>
    api.get<User>('/auth/me').then(r => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (data: ResetPasswordPayload) =>
    api.post('/auth/reset-password', data).then(r => r.data),
}

// ── 401 handling ──────────────────────────────────────────────────────────────

// Auth-form endpoints own their inline error UX, and `/auth/me` returning 401
// is the expected "not logged in" state — neither should trigger the global
// redirect-to-login behavior below.
const AUTH_401_REDIRECT_EXCLUSIONS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/me',
]

export function isAuthRedirectExcluded(url: string): boolean {
  return AUTH_401_REDIRECT_EXCLUSIONS.some(path => url.includes(path))
}

// Phase 1 default: hard redirect. `contexts/AuthContext.tsx` (Phase 2)
// overrides this via `setUnauthorizedHandler` to also invalidate the
// `['auth', 'me']` query before navigating, without `lib/api.ts` needing to
// import React Query or `next/navigation` directly.
type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler = () => {
  if (typeof window !== 'undefined') {
    window.location.assign('/login')
  }
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

api.interceptors.response.use(
  response => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    if (status === 401 && !isAuthRedirectExcluded(url)) {
      unauthorizedHandler()
    }
    return Promise.reject(error)
  },
)

// ── Carteras ──────────────────────────────────────────────────────────────────

export const carteras = {
  listar: () =>
    api.get<Cartera[]>('/carteras').then(r => r.data),

  crear: (data: CarteraCreate) =>
    api.post<Cartera>('/carteras', data).then(r => r.data),

  eliminar: (id: number) =>
    api.delete(`/carteras/${id}`).then(r => r.data),
}

// ── Movimientos ───────────────────────────────────────────────────────────────

export const movimientos = {
  listar: (carteraId: number) =>
    api.get<Movimiento[]>(`/carteras/${carteraId}/movimientos`).then(r => r.data),

  crear: (data: MovimientoCreate) =>
    api.post<Movimiento>('/movimientos', data).then(r => r.data),

  eliminar: (id: number) =>
    api.delete(`/movimientos/${id}`).then(r => r.data),
}

// ── Posiciones y análisis ─────────────────────────────────────────────────────

export const portfolio = {
  resumen: (carteraId: number) =>
    api.get<ResumenCartera>(`/carteras/${carteraId}/resumen`).then(r => r.data),

  analisis: (carteraId: number) =>
    api.get<AnalisisCartera>(`/carteras/${carteraId}/analisis`).then(r => r.data),
}

// ── Instrumentos ──────────────────────────────────────────────────────────────

export const instrumentos = {
  autodescubrir: (isin: string) =>
    api.get<Instrumento>(`/instrumentos/autodescubrir/${isin}`).then(r => r.data),

  listar: () =>
    api.get<Instrumento[]>('/instrumentos').then(r => r.data),

  actualizar: (id: number, data: InstrumentoUpdate) =>
    api.patch<Instrumento>(`/instrumentos/${id}`, data).then(r => r.data),
}

export default api
