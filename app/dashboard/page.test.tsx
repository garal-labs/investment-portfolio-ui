import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './page'
import type { Posicion, ResumenCartera } from '@/types'

const useActiveCarteraMock = vi.fn()
const useResumenMock = vi.fn()
const useRentabilidadMock = vi.fn()

vi.mock('@/contexts/CarteraContext', () => ({
  useActiveCartera: () => useActiveCarteraMock(),
}))

vi.mock('@/hooks/useCartera', () => ({
  useResumen: (...args: unknown[]) => useResumenMock(...args),
  useRentabilidad: (...args: unknown[]) => useRentabilidadMock(...args),
}))

// The shell chrome (Sidebar/Topbar/CarteraSelector) needs auth/router/query
// context this test isn't about — it's already covered elsewhere. Stub it
// down to a passthrough so this file stays focused on data wiring + hover.
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/layout/Topbar', () => ({ Topbar: () => null }))
vi.mock('@/components/layout/CarteraSelector', () => ({ CarteraSelector: () => null }))

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

function posicion(overrides: Partial<Posicion> & { instrumento: Posicion['instrumento'] }): Posicion {
  return {
    cantidad_actual: 10,
    coste_total: 1000,
    precio_medio: 100,
    plusvalia_realizada: 0,
    ...overrides,
  }
}

const posA = posicion({
  instrumento: { id: 1, isin: 'AAA0000000A0', ticker: 'AAA', nombre: 'Position A', tipo: 'Acción', sector: 'Tecnología', pais: 'España', moneda: 'EUR' },
  coste_total: 600,
  valor_actual_eur: 600,
  valor_actual: 600,
  precio_actual_eur: 60,
  plusvalia_latente: 0,
  rentabilidad_pct: 0,
})

const posB = posicion({
  instrumento: { id: 2, isin: 'BBB0000000B0', ticker: 'BBB', nombre: 'Position B', tipo: 'Acción', sector: 'Salud', pais: 'España', moneda: 'EUR' },
  coste_total: 400,
  valor_actual_eur: 400,
  valor_actual: 400,
  precio_actual_eur: 40,
  plusvalia_latente: 0,
  rentabilidad_pct: 0,
})

function resumen(posiciones: Posicion[]): ResumenCartera {
  const valor_total = posiciones.reduce((sum, p) => sum + (p.valor_actual_eur ?? 0), 0)
  return {
    cartera: { id: 1, nombre: 'Mi cartera', created_at: '' },
    valor_total,
    coste_total: valor_total,
    plusvalia_latente: 0,
    plusvalia_realizada: 0,
    plusvalia_total: 0,
    rentabilidad_pct: 0,
    num_posiciones: posiciones.length,
    posiciones,
  }
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })))
  useActiveCarteraMock.mockReturnValue({ carteraId: 1, carteras: [], isLoading: false })
  useRentabilidadMock.mockReturnValue({ data: undefined, isLoading: false })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('DashboardPage — composition and data wiring', () => {
  it('maps resumen positions into ValueBlock/CompositionCard/PositionsTable', () => {
    useResumenMock.mockReturnValue({ data: resumen([posA, posB]), isLoading: false, isError: false })
    render(<DashboardPage />)

    expect(screen.getByText('Composición')).toBeInTheDocument()
    expect(screen.getAllByTestId('treemap-tile')).toHaveLength(2)
    expect(screen.getByTestId('position-row-AAA0000000A0')).toBeInTheDocument()
    expect(screen.getByTestId('position-row-BBB0000000B0')).toBeInTheDocument()
  })

  it('renders consistent empty states when there are zero positions', () => {
    useResumenMock.mockReturnValue({ data: resumen([]), isLoading: false, isError: false })
    render(<DashboardPage />)

    expect(screen.queryAllByTestId('treemap-tile')).toHaveLength(0)
    expect(screen.getByText('No hay posiciones aún. Añade tu primer movimiento.')).toBeInTheDocument()
  })
})

describe('DashboardPage — hover cross-highlight', () => {
  beforeEach(() => {
    useResumenMock.mockReturnValue({ data: resumen([posA, posB]), isLoading: false, isError: false })
  })

  it('hovering a treemap tile dims the non-matching positions table row', () => {
    render(<DashboardPage />)
    const [tileA] = screen.getAllByTestId('treemap-tile')

    act(() => fireEvent.mouseEnter(tileA))

    expect(screen.getByTestId('position-row-AAA0000000A0')).toHaveStyle({ opacity: '1' })
    expect(screen.getByTestId('position-row-BBB0000000B0')).toHaveStyle({ opacity: '0.45' })
  })

  it('hovering a table row dims the non-matching treemap tile', () => {
    render(<DashboardPage />)
    const rowAButton = screen.getByTestId('position-row-AAA0000000A0').querySelector('button')!

    act(() => fireEvent.mouseEnter(rowAButton))

    const tiles = screen.getAllByTestId('treemap-tile')
    const tileForA = tiles.find(t => t.getAttribute('title')?.startsWith('Position A'))
    const tileForB = tiles.find(t => t.getAttribute('title')?.startsWith('Position B'))
    expect(tileForA?.querySelector('div')).toHaveStyle({ opacity: '1' })
    expect(tileForB?.querySelector('div')).toHaveStyle({ opacity: '0.3' })
  })

  it('clears the highlight when the grouping mode changes', () => {
    render(<DashboardPage />)
    const [tileA] = screen.getAllByTestId('treemap-tile')
    act(() => fireEvent.mouseEnter(tileA))
    expect(screen.getByTestId('position-row-BBB0000000B0')).toHaveStyle({ opacity: '0.45' })

    fireEvent.click(screen.getByRole('tab', { name: 'Sector' }))

    expect(screen.getByTestId('position-row-AAA0000000A0')).toHaveStyle({ opacity: '1' })
    expect(screen.getByTestId('position-row-BBB0000000B0')).toHaveStyle({ opacity: '1' })
  })

  it('grouped hover (Sector) highlights every position sharing that group in the table', () => {
    const posC = posicion({
      instrumento: { id: 3, isin: 'CCC0000000C0', ticker: 'CCC', nombre: 'Position C', tipo: 'Acción', sector: 'Tecnología', pais: 'España', moneda: 'EUR' },
      coste_total: 200,
      valor_actual_eur: 200,
      valor_actual: 200,
      precio_actual_eur: 20,
      plusvalia_latente: 0,
      rentabilidad_pct: 0,
    })
    useResumenMock.mockReturnValue({ data: resumen([posA, posB, posC]), isLoading: false, isError: false })
    render(<DashboardPage />)

    fireEvent.click(screen.getByRole('tab', { name: 'Sector' }))
    const [tecTile] = screen.getAllByTestId('treemap-tile') // Tecnología (A+C=800) sorts before Salud (B=400)

    act(() => fireEvent.mouseEnter(tecTile))

    expect(screen.getByTestId('position-row-AAA0000000A0')).toHaveStyle({ opacity: '1' })
    expect(screen.getByTestId('position-row-CCC0000000C0')).toHaveStyle({ opacity: '1' })
    expect(screen.getByTestId('position-row-BBB0000000B0')).toHaveStyle({ opacity: '0.45' })
  })
})
