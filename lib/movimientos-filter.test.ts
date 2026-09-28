import { describe, expect, it } from 'vitest'
import { filterMovimientosPorIsin } from './movimientos-filter'
import type { Movimiento } from '@/types'

function mov(overrides: Partial<Movimiento> & { isin: string; id: number }): Movimiento {
  const { isin, id, ...rest } = overrides
  return {
    id,
    cartera_id: 1,
    instrumento: { id: id * 10, isin, nombre: `Instrumento ${isin}` },
    tipo: 'compra',
    fecha: '2024-01-01',
    cantidad: 10,
    precio: 100,
    comision: 0,
    created_at: '2024-01-01T00:00:00Z',
    ...rest,
  }
}

const GOOGL = 'US02079K3059'
const MSFT = 'US5949181045'

const MOVS: Movimiento[] = [
  mov({ id: 1, isin: GOOGL }),
  mov({ id: 2, isin: MSFT }),
  mov({ id: 3, isin: GOOGL }),
]

describe('filterMovimientosPorIsin — deep-link filtering for Movimientos', () => {
  it('returns only movimientos matching the given isin', () => {
    const result = filterMovimientosPorIsin(MOVS, MSFT)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
    expect(result[0].instrumento.isin).toBe(MSFT)
  })

  it('returns movimientos for a different isin, proving the filter is not hardcoded', () => {
    const result = filterMovimientosPorIsin(MOVS, GOOGL)

    expect(result).toHaveLength(2)
    expect(result.map(m => m.id)).toEqual([1, 3])
  })

  it('returns the full unfiltered list when isin is null', () => {
    const result = filterMovimientosPorIsin(MOVS, null)

    expect(result).toHaveLength(3)
    expect(result).toBe(MOVS)
  })

  it('returns an empty array when no movimiento matches the given isin', () => {
    const result = filterMovimientosPorIsin(MOVS, 'DE000BASF111')

    expect(result).toEqual([])
  })
})
