import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCompositionSubtitle, CompositionCard } from './CompositionCard'
import type { CompositionGroup, PositionViewModel } from '@/lib/portfolio-calc'

type ResizeCallback = (entries: { contentRect: { width: number } }[]) => void

class MockResizeObserver {
  callback: ResizeCallback
  constructor(cb: ResizeCallback) {
    this.callback = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function group(overrides: Partial<CompositionGroup> & { key: string; valor: number; peso: number }): CompositionGroup {
  return { name: overrides.key, count: 1, ...overrides }
}

function pv(overrides: Partial<PositionViewModel> & { isin: string; peso: number }): PositionViewModel {
  return {
    ticker: overrides.isin,
    nombre: overrides.isin,
    tipo: 'Acción',
    sector: 'Tecnología',
    pais: 'España',
    moneda: 'EUR',
    cantidad: 10,
    precioMedio: 10,
    precioActualEur: 10,
    valorEur: overrides.peso * 1000,
    costeTotal: overrides.peso * 900,
    plusvalia: overrides.peso * 100,
    rentabilidadPct: 10,
    ...overrides,
  }
}

describe('buildCompositionSubtitle — pure function', () => {
  it('sums the top 3 groups weight when grouped by posicion', () => {
    const groups: CompositionGroup[] = [
      group({ key: 'a', valor: 500, peso: 0.5 }),
      group({ key: 'b', valor: 300, peso: 0.3 }),
      group({ key: 'c', valor: 150, peso: 0.15 }),
      group({ key: 'd', valor: 50, peso: 0.05 }),
    ]
    expect(buildCompositionSubtitle(groups, 'posicion')).toBe('Las 3 mayores posiciones suman el 95,0 %')
  })

  it('sums all available groups when fewer than 3 positions exist', () => {
    const groups: CompositionGroup[] = [
      group({ key: 'a', valor: 600, peso: 0.6 }),
      group({ key: 'b', valor: 400, peso: 0.4 }),
    ]
    expect(buildCompositionSubtitle(groups, 'posicion')).toBe('Las 3 mayores posiciones suman el 100,0 %')
  })

  it('describes group count and largest group weight for sector grouping', () => {
    const groups: CompositionGroup[] = [
      group({ key: 'Tecnología', valor: 700, peso: 0.7, count: 2 }),
      group({ key: 'Salud', valor: 300, peso: 0.3, count: 1 }),
    ]
    expect(buildCompositionSubtitle(groups, 'sector')).toBe('2 grupos · el mayor pesa 70,0 %')
  })

  it('handles a single group when all positions share one país value', () => {
    const groups: CompositionGroup[] = [group({ key: 'España', valor: 1000, peso: 1, count: 3 })]
    expect(buildCompositionSubtitle(groups, 'pais')).toBe('1 grupos · el mayor pesa 100,0 %')
  })

  it('handles a single group when all positions share one tipo value', () => {
    const groups: CompositionGroup[] = [group({ key: 'Acción', valor: 1000, peso: 1, count: 3 })]
    expect(buildCompositionSubtitle(groups, 'tipo')).toBe('1 grupos · el mayor pesa 100,0 %')
  })
})

describe('CompositionCard — rendering', () => {
  it('renders the title and the default posicion-grouped subtitle', () => {
    const positions = [
      pv({ isin: 'A', peso: 0.6 }),
      pv({ isin: 'B', peso: 0.4 }),
    ]
    render(<CompositionCard positions={positions} />)
    expect(screen.getByRole('heading', { name: 'Composición' })).toBeInTheDocument()
    expect(screen.getByText('Las 3 mayores posiciones suman el 100,0 %')).toBeInTheDocument()
  })

  it('changing the grouping control re-renders Treemap with newly grouped data', () => {
    const positions = [
      pv({ isin: 'A', peso: 0.5, sector: 'Tecnología' }),
      pv({ isin: 'B', peso: 0.3, sector: 'Tecnología' }),
      pv({ isin: 'C', peso: 0.2, sector: 'Salud' }),
    ]
    render(<CompositionCard positions={positions} />)
    expect(screen.getAllByTestId('treemap-tile')).toHaveLength(3)

    fireEvent.click(screen.getByRole('tab', { name: 'Sector' }))

    expect(screen.getAllByTestId('treemap-tile')).toHaveLength(2)
    expect(screen.getByText('2 grupos · el mayor pesa 80,0 %')).toBeInTheDocument()
  })

  it('forwards hover events from Treemap tiles to the onHover callback', () => {
    const onHover = vi.fn()
    const positions = [pv({ isin: 'A', peso: 1 })]
    render(<CompositionCard positions={positions} onHover={onHover} />)
    fireEvent.mouseEnter(screen.getByTestId('treemap-tile'))
    expect(onHover).toHaveBeenCalledWith('A')
  })
})
