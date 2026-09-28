import { describe, expect, it } from 'vitest'
import { buildPositionViewModels, groupPositions } from './portfolio-calc'
import type { Posicion } from '@/types'

function posicion(overrides: Partial<Posicion> & { instrumento: Posicion['instrumento'] }): Posicion {
  return {
    cantidad_actual: 10,
    coste_total: 1000,
    precio_medio: 100,
    plusvalia_realizada: 0,
    ...overrides,
  }
}

const msft = posicion({
  instrumento: {
    id: 1, isin: 'US5949181045', ticker: 'MSFT', nombre: 'Microsoft',
    tipo: 'Acción', sector: 'Tecnología', pais: 'EE. UU.', moneda: 'USD',
  },
  cantidad_actual: 14,
  coste_total: 3990,
  precio_medio: 285,
  valor_actual_eur: 5635,
  valor_actual: 5635,
  precio_actual_eur: 402.5,
  precio_actual_nativo: 436.2,
  moneda_nativa: 'USD',
  plusvalia_latente: 1645,
  rentabilidad_pct: 41.23,
})

const itx = posicion({
  instrumento: {
    id: 2, isin: 'ES0148396007', ticker: 'ITX', nombre: 'Inditex',
    tipo: 'Acción', sector: 'Consumo', pais: 'España', moneda: 'EUR',
  },
  cantidad_actual: 70,
  coste_total: 2674,
  precio_medio: 38.2,
  valor_actual_eur: 3612,
  valor_actual: 3612,
  precio_actual_eur: 51.6,
  plusvalia_latente: 938,
  rentabilidad_pct: 35.08,
})

describe('buildPositionViewModels — derived math', () => {
  it('computes peso, coste, plusvalía and rentabilidad from known fixtures', () => {
    const total = 5635 + 3612
    const [vm] = buildPositionViewModels([msft], total)

    expect(vm.isin).toBe('US5949181045')
    expect(vm.ticker).toBe('MSFT')
    expect(vm.costeTotal).toBe(3990)
    expect(vm.valorEur).toBe(5635)
    expect(vm.plusvalia).toBe(1645)
    expect(vm.rentabilidadPct).toBeCloseTo(41.23, 2)
    expect(vm.peso).toBeCloseTo(5635 / total, 6)
    expect(vm.precioActualNativo).toBe(436.2)
  })

  it('single position weighs 100% of the total', () => {
    const [vm] = buildPositionViewModels([itx], 3612)
    expect(vm.peso).toBeCloseTo(1, 6)
  })

  it('zero cost does not throw or produce NaN/Infinity rentabilidad', () => {
    const zeroCost = posicion({
      instrumento: { id: 3, isin: 'ZC0000000000', nombre: 'Zero Cost' },
      coste_total: 0,
      valor_actual_eur: 500,
      plusvalia_latente: 500,
      rentabilidad_pct: undefined,
    })
    const [vm] = buildPositionViewModels([zeroCost], 500)
    expect(vm.costeTotal).toBe(0)
    expect(Number.isFinite(vm.rentabilidadPct)).toBe(true)
    expect(Number.isNaN(vm.rentabilidadPct)).toBe(false)
  })

  it('negative gain is preserved as a negative number', () => {
    const losing = posicion({
      instrumento: { id: 4, isin: 'LOSS00000000', nombre: 'Losing Position' },
      coste_total: 1000,
      valor_actual_eur: 700,
      plusvalia_latente: -300,
      rentabilidad_pct: -30,
    })
    const [vm] = buildPositionViewModels([losing], 700)
    expect(vm.plusvalia).toBe(-300)
    expect(vm.rentabilidadPct).toBe(-30)
  })

  it('falls back sector/pais to "—" when missing', () => {
    const sparse = posicion({
      instrumento: { id: 5, isin: 'SPARSE000000', nombre: 'Sparse' },
      valor_actual_eur: 100,
    })
    const [vm] = buildPositionViewModels([sparse], 100)
    expect(vm.sector).toBe('—')
    expect(vm.pais).toBe('—')
  })

  it('zero positions returns an empty array, not an error', () => {
    expect(buildPositionViewModels([], 0)).toEqual([])
  })
})

describe('groupPositions — grouping modes', () => {
  const total = 5635 + 3612
  const vms = buildPositionViewModels([msft, itx], total)

  it('groups by posicion (one group per isin, named by nombre, short=ticker)', () => {
    const groups = groupPositions(vms, 'posicion')
    expect(groups).toHaveLength(2)
    expect(groups[0].key).toBe('US5949181045')
    expect(groups[0].name).toBe('Microsoft')
    expect(groups[0].short).toBe('MSFT')
  })

  it('groups by sector, ordered by descending value', () => {
    const groups = groupPositions(vms, 'sector')
    expect(groups.map(g => g.key)).toEqual(['Tecnología', 'Consumo'])
    expect(groups[0].peso).toBeGreaterThan(groups[1].peso)
  })

  it('groups by pais and tipo', () => {
    expect(groupPositions(vms, 'pais').map(g => g.key).sort()).toEqual(['EE. UU.', 'España'])
    expect(groupPositions(vms, 'tipo').map(g => g.key)).toEqual(['Acción'])
  })

  it('buckets missing sector/pais under "—" instead of dropping the position', () => {
    const sparse = posicion({
      instrumento: { id: 6, isin: 'SPARSE111111', nombre: 'Sparse Co' },
      valor_actual_eur: 200,
    })
    const sparseVms = buildPositionViewModels([sparse], 200)
    const groups = groupPositions(sparseVms, 'sector')
    expect(groups).toHaveLength(1)
    expect(groups[0].key).toBe('—')
  })

  it('zero positions returns an empty array, not an error', () => {
    expect(groupPositions([], 'sector')).toEqual([])
  })
})
