import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AnalisisPage from './page'
import { server } from '@/test/mocks/server'
import { fronteraEficienteFixture } from '@/test/mocks/fixtures/fronteraEficiente'
import { formatFecha } from '@/lib/utils'
import type { FronteraEficiente } from '@/types'

const useActiveCarteraMock = vi.fn()

vi.mock('@/contexts/CarteraContext', () => ({
  useActiveCartera: () => useActiveCarteraMock(),
}))

// Shell chrome needs auth/router context this test isn't about (see
// app/dashboard/page.test.tsx); stub it to a passthrough.
vi.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/layout/Topbar', () => ({ Topbar: () => null }))

const FRONTERA_URL = '/api/v1/carteras/:id/markowitz'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AnalisisPage />
    </QueryClientProvider>,
  )
}

function respondWith(body: FronteraEficiente) {
  server.use(http.get(FRONTERA_URL, () => HttpResponse.json(body)))
}

beforeEach(() => {
  useActiveCarteraMock.mockReturnValue({ carteraId: 1, carteras: [], isLoading: false })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AnalisisPage — result', () => {
  it('shows the analysed window, monthly observations and the monthly-figures note', async () => {
    renderPage()

    expect(await screen.findByText(/13 observaciones mensuales/)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${formatFecha('2025-09-01')} – ${formatFecha('2026-09-30')}`))).toBeInTheDocument()
    expect(screen.getByText(/no anualizadas/)).toBeInTheDocument()
  })

  it('drops the duplicated "Cifras clave" and "Pesos por activo" blocks', async () => {
    renderPage()

    await screen.findByText(/13 observaciones mensuales/)
    expect(screen.queryByRole('region', { name: 'Cifras clave' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Pesos por activo' })).not.toBeInTheDocument()
    expect(screen.queryByText('Cifras clave')).not.toBeInTheDocument()
    expect(screen.queryByText('Pesos por activo')).not.toBeInTheDocument()
  })

  it('shows the current-vs-chosen comparison only once', async () => {
    renderPage()

    await screen.findByText(/13 observaciones mensuales/)
    expect(screen.getAllByText('Cartera actual', { selector: 'li span' })).toHaveLength(1)
    expect(screen.getAllByRole('list', { name: 'Comparación con el punto elegido' })).toHaveLength(1)
  })

  it('shows the exclusions notice with a label per reason and the excluded share', async () => {
    respondWith({
      ...fronteraEficienteFixture,
      excluidos: [
        { ticker: 'IE00B4L5Y983', motivo: 'sin_ticker' },
        { ticker: 'XYZ', motivo: 'sin_precio_actual' },
        { ticker: 'AAPL', motivo: 'sin_tipo_cambio' },
        { ticker: 'NEW', motivo: 'sin_historico' },
        { ticker: 'IPO', motivo: 'historico_insuficiente' },
      ],
      peso_excluido: 0.25,
    })
    renderPage()

    const notice = await screen.findByRole('region', { name: 'Activos excluidos del cálculo' })
    expect(within(notice).getByText(/25,0 %/)).toBeInTheDocument()
    expect(within(notice).getByText('IE00B4L5Y983').parentElement).toHaveTextContent('sin ticker')
    expect(within(notice).getByText('XYZ').parentElement).toHaveTextContent('sin precio actual')
    expect(within(notice).getByText('AAPL').parentElement).toHaveTextContent('sin tipo de cambio')
    expect(within(notice).getByText('NEW').parentElement).toHaveTextContent('sin histórico de precios')
    expect(within(notice).getByText('IPO').parentElement).toHaveTextContent('histórico insuficiente (< 12 meses)')
  })

  it('renders the calculation detail below the result', async () => {
    renderPage()

    const detalle = await screen.findByRole('region', { name: 'Detalle del cálculo' })
    const moves = screen.getByRole('region', { name: 'Movimientos para llegar al punto elegido' })
    expect(moves.compareDocumentPosition(detalle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(detalle).getByText('Matriz de correlaciones')).toBeInTheDocument()
  })

  it('hides the exclusions notice when nothing was excluded', async () => {
    respondWith({ ...fronteraEficienteFixture, excluidos: [], peso_excluido: 0 })
    renderPage()

    await screen.findByText(/13 observaciones mensuales/)
    expect(screen.queryByRole('region', { name: 'Activos excluidos del cálculo' })).not.toBeInTheDocument()
  })
})

describe('AnalisisPage — rebalancing moves', () => {
  const MOVES = 'Movimientos para llegar al punto elegido'

  it('preselects the frontier point closest in volatility and shows the moves to reach it', async () => {
    renderPage()

    const slider = await screen.findByRole('slider', { name: 'Riesgo objetivo' })
    expect(slider).toHaveValue('0')

    const table = screen.getByRole('table', { name: MOVES })
    const aapl = within(table).getByRole('row', { name: /AAPL/ })
    expect(within(aapl).getByText('62,0 %')).toBeInTheDocument()
    expect(within(aapl).getByText('+10,0 pp')).toBeInTheDocument()
    expect(within(aapl).getByText('+1.000,00 €')).toBeInTheDocument()
    expect(within(aapl).getByText('Comprar')).toBeInTheDocument()
    const msft = within(table).getByRole('row', { name: /MSFT/ })
    expect(within(msft).getByText('−500,00 €')).toBeInTheDocument()
    expect(within(msft).getByText('Vender')).toBeInTheDocument()
  })

  it('places the moves right after the chart and before the calculation detail', async () => {
    renderPage()

    const moves = await screen.findByRole('region', { name: MOVES })
    const chart = screen.getByRole('region', { name: 'Riesgo y rentabilidad' })
    const detalle = screen.getByRole('region', { name: 'Detalle del cálculo' })
    expect(chart.compareDocumentPosition(moves) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(moves.compareDocumentPosition(detalle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows the current EUR value per ticker in the moves table', async () => {
    renderPage()

    const table = await screen.findByRole('table', { name: MOVES })
    expect(within(within(table).getByRole('row', { name: /AAPL/ })).getByText('5.200,00 €')).toBeInTheDocument()
    expect(within(within(table).getByRole('row', { name: /MSFT/ })).getByText('3.100,00 €')).toBeInTheDocument()
    expect(within(within(table).getByRole('row', { name: /SAN\.MC/ })).getByText('1.700,00 €')).toBeInTheDocument()
  })

  it('selects the minimum-variance point from the shortcut and labels the target accordingly', async () => {
    renderPage()

    const slider = await screen.findByRole('slider', { name: 'Riesgo objetivo' })
    fireEvent.change(slider, { target: { value: '2' } })
    const resumen = screen.getByRole('list', { name: 'Comparación con el punto elegido' })
    expect(within(resumen).getByText('Punto elegido')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mínima varianza' }))

    expect(slider).toHaveValue('0')
    expect(within(resumen).getByText('Mínima varianza')).toBeInTheDocument()
    expect(within(resumen).queryByText('Punto elegido')).not.toBeInTheDocument()
    const table = screen.getByRole('table', { name: MOVES })
    const minima = fronteraEficienteFixture.cartera_minima_varianza.pesos
    expect(within(within(table).getByRole('row', { name: /AAPL/ })).getByText('62,0 %')).toBeInTheDocument()
    expect(within(within(table).getByRole('row', { name: /MSFT/ })).getByText('26,0 %')).toBeInTheDocument()
    expect(minima).toEqual({ AAPL: 0.62, MSFT: 0.26, 'SAN.MC': 0.12 })
  })
  it('updates target weights and amounts when the slider moves', async () => {
    renderPage()

    const slider = await screen.findByRole('slider', { name: 'Riesgo objetivo' })
    fireEvent.change(slider, { target: { value: '2' } })

    expect(slider).toHaveValue('2')
    const table = screen.getByRole('table', { name: MOVES })
    const aapl = within(table).getByRole('row', { name: /AAPL/ })
    expect(within(aapl).getByText('64,5 %')).toBeInTheDocument()
    expect(within(aapl).getByText('+1.250,00 €')).toBeInTheDocument()
    const msft = within(table).getByRole('row', { name: /MSFT/ })
    expect(within(msft).getByText('−31,0 pp')).toBeInTheDocument()
    expect(within(msft).getByText('−3.100,00 €')).toBeInTheDocument()
  })

  it('resets the selection to the default when the horizon changes', async () => {
    renderPage()

    const slider = await screen.findByRole('slider', { name: 'Riesgo objetivo' })
    fireEvent.change(slider, { target: { value: '4' } })
    expect(slider).toHaveValue('4')

    fireEvent.click(screen.getByRole('tab', { name: '10 años' }))

    await waitFor(() => expect(screen.getByRole('slider', { name: 'Riesgo objetivo' })).toHaveValue('0'))
  })

  it('shows no moves when the frontier is empty', async () => {
    respondWith({ ...fronteraEficienteFixture, frontera: [] })
    renderPage()

    await screen.findByText(/13 observaciones mensuales/)
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: MOVES })).not.toBeInTheDocument()
  })
})

describe('AnalisisPage — methodology link', () => {
  const METODOLOGIA = '¿Cómo se calcula?'

  it('links the header to the methodology page in a new tab', async () => {
    renderPage()

    await screen.findByText(/13 observaciones mensuales/)
    const header = screen.getByRole('region', { name: 'Frontera eficiente' })
    const link = within(header).getByRole('link', { name: METODOLOGIA })
    expect(link).toHaveAttribute('href', '/markowitz/metodologia')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('no longer renders the methodology section in the page', async () => {
    renderPage()

    await screen.findByText(/13 observaciones mensuales/)
    expect(screen.queryByRole('region', { name: METODOLOGIA })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: METODOLOGIA })).not.toBeInTheDocument()
  })

  it('keeps the link on a 400 so the requirements can be read', async () => {
    const detail = 'No hay suficientes activos con histórico para calcular la frontera.'
    server.use(http.get(FRONTERA_URL, () => HttpResponse.json({ detail }, { status: 400 })))
    renderPage()

    await screen.findByText(detail)
    const header = screen.getByRole('region', { name: 'Frontera eficiente' })
    expect(within(header).getByRole('link', { name: METODOLOGIA })).toHaveAttribute('href', '/markowitz/metodologia')
  })

  it('does not render the link without a cartera', () => {
    useActiveCarteraMock.mockReturnValue({ carteras: [], carteraId: null, isLoading: false })
    renderPage()

    expect(screen.getByText(/No tenés carteras todavía/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: METODOLOGIA })).not.toBeInTheDocument()
  })
})

describe('AnalisisPage — years selector', () => {
  it('defaults to 5 years and refetches with the selected `anios`', async () => {
    const requested: (string | null)[] = []
    server.use(
      http.get(FRONTERA_URL, ({ request }) => {
        requested.push(new URL(request.url).searchParams.get('anios'))
        return HttpResponse.json(fronteraEficienteFixture)
      }),
    )
    renderPage()

    await screen.findByText(/13 observaciones mensuales/)
    expect(requested).toEqual(['5'])
    expect(screen.getByRole('tab', { name: '5 años' })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('tab', { name: '10 años' }))

    await waitFor(() => expect(requested).toEqual(['5', '10']))
    expect(screen.getByRole('tab', { name: '10 años' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('AnalisisPage — error and empty states', () => {
  it('shows the backend detail on 400 (insufficient data)', async () => {
    const detail = 'No hay suficientes activos con histórico para calcular la frontera.'
    server.use(http.get(FRONTERA_URL, () => HttpResponse.json({ detail }, { status: 400 })))
    renderPage()

    expect(await screen.findByText(detail)).toBeInTheDocument()
    // The selector stays available so another horizon can be tried.
    expect(screen.getByRole('tab', { name: '3 años' })).toBeInTheDocument()
  })

  it('shows the price-provider message on 503', async () => {
    server.use(http.get(FRONTERA_URL, () => HttpResponse.json({ detail: 'upstream' }, { status: 503 })))
    renderPage()

    expect(
      await screen.findByText('El proveedor de precios no está disponible. Prueba de nuevo en unos minutos.'),
    ).toBeInTheDocument()
  })

  it('shows the no-cartera state without requesting the frontier', async () => {
    const requested: string[] = []
    server.use(
      http.get(FRONTERA_URL, ({ request }) => {
        requested.push(request.url)
        return HttpResponse.json(fronteraEficienteFixture)
      }),
    )
    useActiveCarteraMock.mockReturnValue({ carteraId: null, carteras: [], isLoading: false })
    renderPage()

    expect(screen.getByText(/No tenés carteras todavía/)).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(requested).toHaveLength(0)
  })
})
