import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/lib/preferences'
import { buildPositionColorMap, PositionsTable, sortPositions } from './PositionsTable'
import type { PositionViewModel } from '@/lib/portfolio-calc'

const STORAGE_KEY = 'garal.preferences.v1'

function vm(overrides: Partial<PositionViewModel> & { isin: string }): PositionViewModel {
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
    valorEur: 1000,
    costeTotal: 900,
    plusvalia: 100,
    rentabilidadPct: 10,
    peso: 0.5,
    ...overrides,
  }
}

function renderTable(positions: PositionViewModel[]) {
  return render(
    <PreferencesProvider>
      <PositionsTable positions={positions} />
    </PreferencesProvider>,
  )
}

describe('sortPositions — pure function', () => {
  const positions = [
    vm({ isin: 'A', nombre: 'Bravo', peso: 0.2, rentabilidadPct: 30 }),
    vm({ isin: 'B', nombre: 'Alfa', peso: 0.5, rentabilidadPct: 10 }),
    vm({ isin: 'C', nombre: 'Charlie', peso: 0.3, rentabilidadPct: 50 }),
  ]

  it('sorts by peso descending', () => {
    expect(sortPositions(positions, 'peso').map(p => p.isin)).toEqual(['B', 'C', 'A'])
  })

  it('sorts by rentabilidad descending', () => {
    expect(sortPositions(positions, 'rent').map(p => p.isin)).toEqual(['C', 'A', 'B'])
  })

  it('sorts by nombre A-Z', () => {
    expect(sortPositions(positions, 'nombre').map(p => p.isin)).toEqual(['B', 'A', 'C'])
  })
})

describe('buildPositionColorMap — pure function', () => {
  it('assigns treemapColor by descending-weight order, matching each position\'s own treemap tile', () => {
    const positions = [
      vm({ isin: 'A', peso: 0.2, valorEur: 200 }),
      vm({ isin: 'B', peso: 0.6, valorEur: 600 }),
      vm({ isin: 'C', peso: 0.2, valorEur: 200 }),
    ]
    const map = buildPositionColorMap(positions)
    expect(map.B).toBe('#2D6A5A')
    expect(map.A).toBe('#c4956a')
  })
})

describe('PositionsTable — default sort', () => {
  it('renders rows in Peso descending order by default', () => {
    const positions = [
      vm({ isin: 'A', nombre: 'Alfa', peso: 0.2 }),
      vm({ isin: 'B', nombre: 'Beta', peso: 0.7 }),
    ]
    renderTable(positions)
    const names = screen.getAllByText(/Alfa|Beta/).map(el => el.textContent)
    expect(names).toEqual(['Beta', 'Alfa'])
  })
})

describe('PositionsTable — switching sort', () => {
  it('re-orders rows when Nombre is selected', () => {
    const positions = [
      vm({ isin: 'A', nombre: 'Zeta', peso: 0.7 }),
      vm({ isin: 'B', nombre: 'Alfa', peso: 0.2 }),
    ]
    renderTable(positions)
    fireEvent.click(screen.getByRole('tab', { name: 'Nombre' }))
    const names = screen.getAllByText(/Zeta|Alfa/).map(el => el.textContent)
    expect(names).toEqual(['Alfa', 'Zeta'])
  })
})

describe('PositionsTable — empty state', () => {
  it('renders an empty-state message with zero positions', () => {
    renderTable([])
    expect(screen.getByText(/No hay posiciones/)).toBeInTheDocument()
  })
})

describe('PositionsTable — density', () => {
  it('applies 10px row padding in compact density', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ density: 'compact' }))
    renderTable([vm({ isin: 'A', nombre: 'Alfa' })])

    await waitFor(() => expect(screen.getByRole('button', { name: /Alfa/ })).toHaveStyle({ paddingTop: '10px' }))
  })
})

describe('PositionsTable — single open row', () => {
  it('only keeps one expanded row open at a time', () => {
    const positions = [
      vm({ isin: 'A', nombre: 'Alfa', peso: 0.7 }),
      vm({ isin: 'B', nombre: 'Beta', peso: 0.3 }),
    ]
    renderTable(positions)
    fireEvent.click(screen.getByRole('button', { name: /Alfa/ }))
    expect(screen.getByText('Ver movimientos de A →')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Beta/ }))
    expect(screen.queryByText('Ver movimientos de A →')).not.toBeInTheDocument()
    expect(screen.getByText('Ver movimientos de B →')).toBeInTheDocument()
  })
})
