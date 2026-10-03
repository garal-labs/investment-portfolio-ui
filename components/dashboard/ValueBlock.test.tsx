import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/lib/preferences'
import { ValueBlock, computeHero, isPeriodoDegradado, PERIODO_DESCRIPCION } from './ValueBlock'
import type { RentabilidadCartera } from '@/types'

const STORAGE_KEY = 'garal.preferences.v1'

const resumen = { valor_total: 15000, coste_total: 10000, plusvalia_realizada: 500 }

function rentabilidad(overrides: Partial<RentabilidadCartera> = {}): RentabilidadCartera {
  return {
    periodo: '1m',
    fecha_inicio: '2026-08-01',
    fecha_fin: '2026-09-01',
    valor_total: 15000,
    coste_total: 10000,
    plusvalia_latente: 612.4,
    plusvalia_realizada: 0,
    plusvalia_total: 612.4,
    rentabilidad_pct: 1.12,
    posiciones: [],
    tickers_sin_dato: [],
    ...overrides,
  }
}

function renderBlock(props: Partial<React.ComponentProps<typeof ValueBlock>> = {}) {
  return render(
    <PreferencesProvider>
      <ValueBlock
        resumen={resumen}
        periodo="total"
        onPeriodoChange={() => {}}
        {...props}
      />
    </PreferencesProvider>,
  )
}

describe('computeHero — pure function', () => {
  it('computes Total as valor actual − coste with "desde la primera compra"', () => {
    const hero = computeHero(resumen, 'total')
    expect(hero).toEqual({ plus: 5000, pct: 50, sub: 'desde la primera compra' })
  })

  it('computes a non-Total period from rentabilidad and its description', () => {
    const hero = computeHero(resumen, '1m', rentabilidad())
    expect(hero).toEqual({ plus: 612.4, pct: 1.12, sub: 'último mes' })
  })

  it('returns null when a non-Total period has no rentabilidad data yet', () => {
    expect(computeHero(resumen, '3m', undefined)).toBeNull()
  })
})

describe('isPeriodoDegradado — pure function', () => {
  it('is true when every position in the period is missing pricing data', () => {
    expect(isPeriodoDegradado(rentabilidad({ posiciones: [{} as never], tickers_sin_dato: ['MSFT'] }))).toBe(true)
  })

  it('is false when at least one position has data', () => {
    expect(isPeriodoDegradado(rentabilidad({ posiciones: [{} as never, {} as never], tickers_sin_dato: ['MSFT'] }))).toBe(false)
  })
})

describe('ValueBlock — Total period', () => {
  it('renders total value and "desde la primera compra" by default', () => {
    renderBlock()
    expect(screen.getByText('+5.000,00 €')).toBeInTheDocument()
    expect(screen.getByText('desde la primera compra')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Total' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('ValueBlock — non-Total period', () => {
  it('computes gain from historical value and shows the period description', () => {
    renderBlock({ periodo: '1m', rentabilidad: rentabilidad() })
    expect(screen.getByText('+612,40 €')).toBeInTheDocument()
    expect(screen.getByText('último mes')).toBeInTheDocument()
  })
})

describe('ValueBlock — negative gain styling', () => {
  it('applies plum color and negative pill background', () => {
    renderBlock({ resumen: { valor_total: 8000, coste_total: 10000, plusvalia_realizada: -200 } })
    const amount = screen.getByText('−2.000,00 €')
    expect(amount).toHaveStyle({ color: '#8a3a6a' })
  })
})

describe('ValueBlock — degraded selected period', () => {
  it('hides plus/pct/sub from rentabilidad when the selected period is degraded', () => {
    renderBlock({
      periodo: '1m',
      rentabilidad: rentabilidad({ posiciones: [{} as never], tickers_sin_dato: ['MSFT'] }),
      unavailablePeriods: ['1m'],
    })
    expect(screen.queryByText('+612,40 €')).not.toBeInTheDocument()
    expect(screen.queryByText('último mes')).not.toBeInTheDocument()
    expect(screen.queryByText(/1,12/)).not.toBeInTheDocument()
  })
})

describe('ValueBlock — degraded period tab', () => {
  it('disables a period with unavailable historical value while Total stays enabled', () => {
    renderBlock({ unavailablePeriods: ['3m'] })
    expect(screen.getByRole('tab', { name: '3M' })).toBeDisabled()
    expect(screen.getByRole('tab', { name: 'Total' })).toBeEnabled()
  })
})

describe('ValueBlock — privacy mode', () => {
  it('masks monetary amounts but not the percentage or period label', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ privacy: true }))
    renderBlock({ periodo: '1m', rentabilidad: rentabilidad() })

    await waitFor(() => expect(screen.getAllByText('••••• €').length).toBeGreaterThan(0))
    expect(screen.getByText('+1,12 %')).toBeInTheDocument()
    expect(screen.getByText('último mes')).toBeInTheDocument()
  })
})

describe('PERIODO_DESCRIPCION — mapping', () => {
  it('maps every period to its Spanish description', () => {
    expect(PERIODO_DESCRIPCION).toEqual({
      total: 'desde la primera compra',
      '1m': 'último mes',
      '3m': 'últimos 3 meses',
      '6m': 'últimos 6 meses',
      ytd: 'en lo que va de año',
      '1y': 'último año',
    })
  })
})
