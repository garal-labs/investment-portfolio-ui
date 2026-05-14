import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { carteras, movimientos, portfolio, instrumentos } from '@/lib/api'
import type { CarteraCreate, MovimientoCreate, InstrumentoUpdate } from '@/types'

// ── Carteras ──────────────────────────────────────────────────────────────────

export function useCarteras() {
  return useQuery({
    queryKey: ['carteras'],
    queryFn: carteras.listar,
  })
}

export function useCrearCartera() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CarteraCreate) => carteras.crear(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['carteras'] }),
  })
}

export function useEliminarCartera() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => carteras.eliminar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['carteras'] }),
  })
}

// ── Resumen y análisis ────────────────────────────────────────────────────────

export function useResumen(carteraId: number) {
  return useQuery({
    queryKey: ['resumen', carteraId],
    queryFn: () => portfolio.resumen(carteraId),
    enabled: !!carteraId,
    refetchInterval: 5 * 60 * 1000,  // refresca precios cada 5 min
  })
}

export function useAnalisis(carteraId: number) {
  return useQuery({
    queryKey: ['analisis', carteraId],
    queryFn: () => portfolio.analisis(carteraId),
    enabled: !!carteraId,
    refetchInterval: 5 * 60 * 1000,
  })
}

// ── Movimientos ───────────────────────────────────────────────────────────────

export function useMovimientos(carteraId: number) {
  return useQuery({
    queryKey: ['movimientos', carteraId],
    queryFn: () => movimientos.listar(carteraId),
    enabled: !!carteraId,
  })
}

export function useCrearMovimiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MovimientoCreate) => movimientos.crear(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['movimientos', vars.cartera_id] })
      qc.invalidateQueries({ queryKey: ['resumen', vars.cartera_id] })
      qc.invalidateQueries({ queryKey: ['analisis', vars.cartera_id] })
    },
  })
}

export function useEliminarMovimiento(carteraId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => movimientos.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimientos', carteraId] })
      qc.invalidateQueries({ queryKey: ['resumen', carteraId] })
      qc.invalidateQueries({ queryKey: ['analisis', carteraId] })
    },
  })
}

// ── Instrumentos ──────────────────────────────────────────────────────────────

export function useAutodescubrir(isin: string) {
  return useQuery({
    queryKey: ['instrumento', isin],
    queryFn: () => instrumentos.autodescubrir(isin),
    enabled: isin.length >= 12,   // solo busca cuando el ISIN tiene longitud mínima
    staleTime: Infinity,           // el ISIN no cambia, no refetchear
  })
}

export function useActualizarInstrumento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: InstrumentoUpdate }) =>
      instrumentos.actualizar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumen'] })
      qc.invalidateQueries({ queryKey: ['analisis'] })
    },
  })
}
