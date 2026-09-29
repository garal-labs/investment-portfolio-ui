import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/lib/preferences'
import { formatCantidadPosicion, PositionRow } from './PositionRow'
import type { PositionViewModel } from '@/lib/portfolio-calc'

const STORAGE_KEY = 'garal.preferences.v1'

function vm(overrides: Partial<PositionViewModel> = {}): PositionViewModel {
  return {
    isin: 'US5949181045',
    ticker: 'MSFT',
    nombre: 'Microsoft',
    tipo: 'Acción',
    sector: 'Tecnología',
    pais: 'EE. UU.',
    moneda: 'EUR',
    cantidad: 14,
    precioMedio: 285,
    precioActualEur: 402.5,
    valorEur: 5635,
    costeTotal: 3990,
    plusvalia: 1645,
    rentabilidadPct: 41.2,
    peso: 0.3,
    ...overrides,
  }
}

function renderRow(overrides: Partial<PositionViewModel> = {}, props: { open?: boolean } = {}) {
  const onToggle = () => {}
  return render(
    <PreferencesProvider>
      <table>
        <tbody>
          <PositionRow
            position={vm(overrides)}
            color="#2D6A5A"
            open={props.open ?? false}
            onToggle={onToggle}
            onHover={() => {}}
            active
          />
        </tbody>
      </table>
    </PreferencesProvider>,
  )
}

describe('formatCantidadPosicion — pure function', () => {
  it('formats a fund quantity with 1 decimal and "part."', () => {
    expect(formatCantidadPosicion(210.5, 'Fondo')).toBe('210,5 part.')
  })

  it('formats an integer share quantity as "títulos"', () => {
    expect(formatCantidadPosicion(14, 'Acción')).toBe('14 títulos')
  })
})

describe('PositionRow — expand/collapse', () => {
  it('calls onToggle when the row is clicked', () => {
    let toggled = false
    render(
      <PreferencesProvider>
        <table>
          <tbody>
            <PositionRow
              position={vm()}
              color="#2D6A5A"
              open={false}
              onToggle={() => { toggled = true }}
              onHover={() => {}}
              active
            />
          </tbody>
        </table>
      </PreferencesProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Microsoft/ }))
    expect(toggled).toBe(true)
  })
})

describe('PositionRow — dual currency', () => {
  it('shows the native USD price on the row and EUR + USD in the expanded detail panel', () => {
    renderRow({ moneda: 'USD', precioActualEur: 402.5, precioActualNativo: 436.2 }, { open: true })
    // Row header shows native currency; the detail panel repeats it as a sub-line
    // under the EUR primary price, so it legitimately appears twice.
    expect(screen.getAllByText('436,20 US$')).toHaveLength(2)
    expect(screen.getByText('402,50 €')).toBeInTheDocument()
  })
})

describe('PositionRow — movimientos link', () => {
  it('renders the exact link text and href for the ticker', () => {
    renderRow({}, { open: true })
    const link = screen.getByRole('link', { name: 'Ver movimientos de MSFT →' })
    expect(link).toHaveAttribute('href', '/movimientos?isin=US5949181045')
  })
})

describe('PositionRow — privacy mode', () => {
  it('masks EUR/USD monetary totals but never unit price or percentage', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ privacy: true }))
    renderRow({ moneda: 'USD', precioActualNativo: 436.2 }, { open: true })

    await waitFor(() => expect(screen.getAllByText('••••• €').length).toBeGreaterThan(0))
    expect(screen.getByText('402,50 €')).toBeInTheDocument()
    expect(screen.getByText('+41,20 %')).toBeInTheDocument()
  })

  it('masks a negative gain without revealing its sign', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ privacy: true }))
    renderRow({ plusvalia: -500, rentabilidadPct: -12.5 })

    await waitFor(() => expect(screen.getAllByText('••••• €').length).toBeGreaterThan(0))
    expect(screen.queryByText(/−500,00 €/)).not.toBeInTheDocument()
    expect(screen.getByText('−12,50 %')).toBeInTheDocument()
  })
})

describe('PositionRow — density', () => {
  it('applies 10px vertical padding in compact density', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ density: 'compact' }))
    renderRow({}, { open: true })

    await waitFor(() => expect(screen.getByRole('button', { name: /Microsoft/ })).toHaveStyle({ paddingTop: '10px', paddingBottom: '10px' }))
  })
})
