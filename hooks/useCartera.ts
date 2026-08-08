import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { carteras, movimientos, portfolio, instrumentos } from '@/lib/api'
import type { CarteraCreate, MovimientoCreate, InstrumentoUpdate, PeriodoRentabilidad } from '@/types'

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

export function useResumen(carteraId: number | null) {
  return useQuery({
    queryKey: ['resumen', carteraId],
    queryFn: () => portfolio.resumen(carteraId as number),
    enabled: carteraId !== null,
    refetchInterval: 5 * 60 * 1000,  // refresca precios cada 5 min
  })
}

export function useAnalisis(carteraId: number | null) {
  return useQuery({
    queryKey: ['analisis', carteraId],
    queryFn: () => portfolio.analisis(carteraId as number),
    enabled: carteraId !== null,
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * `periodo: null` desactiva el fetch (ej. cuando el usuario eligió "Total",
 * que ya se cubre con useResumen). Solo se pide un periodo concreto cuando
 * el usuario lo selecciona explícitamente.
 */
export function useRentabilidad(carteraId: number | null, periodo: PeriodoRentabilidad | null) {
  return useQuery({
    queryKey: ['rentabilidad', carteraId, periodo],
    queryFn: () => portfolio.rentabilidad(carteraId as number, periodo as PeriodoRentabilidad),
    enabled: carteraId !== null && periodo !== null,
  })
}

// ── Movimientos ───────────────────────────────────────────────────────────────

export function useMovimientos(carteraId: number | null) {
  return useQuery({
    queryKey: ['movimientos', carteraId],
    queryFn: () => movimientos.listar(carteraId as number),
    enabled: carteraId !== null,
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

export function useEliminarMovimiento(carteraId: number | null) {
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
