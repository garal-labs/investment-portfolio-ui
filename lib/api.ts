import axios from 'axios'
import type {
  Cartera, CarteraCreate,
  Movimiento, MovimientoCreate,
  ResumenCartera, AnalisisCartera,
  Instrumento, InstrumentoUpdate,
} from '@/types'

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

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
