// Derived-data calculations (peso/coste/plusvalía/rentabilidad %) as pure
// functions, single source of truth consumed by both the composition
// treemap and the positions table (design's "avoid drift" rationale).
import type { Posicion } from '@/types'

const SIN_DATOS = '—'

export interface PositionViewModel {
  isin: string
  ticker: string
  nombre: string
  tipo: string
  sector: string
  pais: string
  moneda: string
  cantidad: number
  precioMedio: number
  precioActualEur: number
  precioActualNativo?: number
  valorEur: number
  costeTotal: number
  plusvalia: number
  rentabilidadPct: number
  // peso is a 0-1 fraction (matches lib/utils.ts formatPeso's contract),
  // not a 0-100 percentage.
  peso: number
}

export function buildPositionViewModels(posiciones: Posicion[], total: number): PositionViewModel[] {
  return posiciones.map(pos => {
    const valorEur = pos.valor_actual_eur ?? pos.valor_actual ?? pos.coste_total
    const costeTotal = pos.coste_total
    const plusvalia = pos.plusvalia_latente ?? valorEur - costeTotal
    const rentabilidadPct =
      pos.rentabilidad_pct ?? (costeTotal > 0 ? (valorEur / costeTotal - 1) * 100 : 0)
    const esDivisaExtranjera = !!pos.moneda_nativa && pos.moneda_nativa !== 'EUR'

    return {
      isin: pos.instrumento.isin,
      ticker: pos.instrumento.ticker ?? pos.instrumento.isin,
      nombre: pos.instrumento.nombre ?? pos.instrumento.isin,
      tipo: pos.instrumento.tipo ?? 'Otro',
      sector: pos.instrumento.sector ?? SIN_DATOS,
      pais: pos.instrumento.pais ?? SIN_DATOS,
      moneda: pos.instrumento.moneda ?? pos.moneda_nativa ?? 'EUR',
      cantidad: pos.cantidad_actual,
      precioMedio: pos.precio_medio,
      precioActualEur: pos.precio_actual_eur ?? pos.precio_actual ?? 0,
      precioActualNativo: esDivisaExtranjera ? pos.precio_actual_nativo : undefined,
      valorEur,
      costeTotal,
      plusvalia,
      rentabilidadPct,
      peso: total > 0 ? valorEur / total : 0,
    }
  })
}

export type Grupo = 'posicion' | 'sector' | 'pais' | 'tipo'

export interface CompositionGroup {
  key: string
  name: string
  short?: string
  valor: number
  peso: number
  count: number
}

const KEY_OF: Record<Grupo, (vm: PositionViewModel) => string> = {
  posicion: vm => vm.isin,
  sector: vm => vm.sector,
  pais: vm => vm.pais,
  tipo: vm => vm.tipo,
}

// Exposed so consumers outside this module (e.g. hover-linking between the
// treemap and the positions table) can compute the same group key a
// position belongs to, without duplicating the per-grupo field mapping.
export function groupKeyOf(vm: PositionViewModel, grupo: Grupo): string {
  return KEY_OF[grupo](vm)
}

export function groupPositions(vms: PositionViewModel[], grupo: Grupo): CompositionGroup[] {
  const keyOf = KEY_OF[grupo]
  const nameOf = grupo === 'posicion' ? (vm: PositionViewModel) => vm.nombre : keyOf

  const groups = new Map<string, CompositionGroup>()
  for (const vm of vms) {
    const key = keyOf(vm)
    const existing = groups.get(key)
    if (existing) {
      existing.valor += vm.valorEur
      existing.peso += vm.peso
      existing.count += 1
    } else {
      groups.set(key, {
        key,
        name: nameOf(vm),
        short: grupo === 'posicion' ? vm.ticker : undefined,
        valor: vm.valorEur,
        peso: vm.peso,
        count: 1,
      })
    }
  }

  return [...groups.values()].sort((a, b) => b.valor - a.valor)
}
