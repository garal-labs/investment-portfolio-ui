import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MovimientoForm } from './MovimientoForm'
import type { Instrumento } from '@/types'

// Bug context (cartera-resumen-redesign, post-verify QA finding): a foreign-
// currency movimiento saved with tipo_cambio left blank makes the backend
// default the historical FX to 1.0 (garal-screener's calculos._tipo_cambio),
// silently treating the native-currency price as if it were already EUR.
// That corrupts coste_total/precio_medio (both meant to be EUR — confirmed
// by reading calculos.py) and produces impossible rentabilidad figures
// (e.g. a real JPY gain displayed as a ~-99% loss). The backend field
// design is correct; the gap is that this form never required tipo_cambio
// for non-EUR instruments. This test locks in that requirement.
const crearMovimientoMock = vi.fn()

vi.mock('@/hooks/useCartera', () => ({
  useCrearMovimiento: () => ({ mutateAsync: crearMovimientoMock, isPending: false }),
  useAutodescubrir: (isin: string) => ({
    data: isin.length >= 12 ? instrumentoPorIsin[isin] : undefined,
    isFetching: false,
  }),
}))

const instrumentoPorIsin: Record<string, Instrumento> = {
  JP3242800005: {
    id: 10,
    isin: 'JP3242800005',
    ticker: '7751.T',
    nombre: 'Canon Inc.',
    tipo: 'Acción',
    sector: 'Tecnología',
    pais: 'Japón',
    moneda: 'JPY',
  },
  ES0148396007: {
    id: 11,
    isin: 'ES0148396007',
    ticker: 'ITX',
    nombre: 'Inditex',
    tipo: 'Acción',
    sector: 'Consumo',
    pais: 'España',
    moneda: 'EUR',
  },
}

async function fillCommonFields(isin: string) {
  const nombreEsperado = instrumentoPorIsin[isin].nombre as string
  fireEvent.change(screen.getByPlaceholderText('ES0148396007'), { target: { value: isin } })
  await waitFor(() => expect(screen.getByDisplayValue(nombreEsperado)).toBeInTheDocument())
  fireEvent.change(screen.getByPlaceholderText('10'), { target: { value: '5' } })
  fireEvent.change(screen.getByPlaceholderText('150.00'), { target: { value: '3200' } })
}

describe('MovimientoForm — tipo de cambio requerido en divisa extranjera', () => {
  it('blocks submit and shows an error when the instrument is foreign-currency and tipo_cambio is blank', async () => {
    render(<MovimientoForm carteraId={1} />)
    await fillCommonFields('JP3242800005')

    fireEvent.click(screen.getByRole('button', { name: 'Guardar movimiento' }))

    expect(await screen.findByText(/tipo de cambio/i)).toBeInTheDocument()
    expect(crearMovimientoMock).not.toHaveBeenCalled()
  })

  it.each(['0', '-1.5'])('rejects tipo_cambio=%s for a foreign-currency instrument', async value => {
    render(<MovimientoForm carteraId={1} />)
    await fillCommonFields('JP3242800005')
    fireEvent.change(screen.getByPlaceholderText('1.08 (USD/EUR)'), { target: { value } })

    fireEvent.click(screen.getByRole('button', { name: 'Guardar movimiento' }))

    expect(await screen.findByText(/tipo de cambio/i)).toBeInTheDocument()
    expect(crearMovimientoMock).not.toHaveBeenCalled()
  })

  it('submits with tipo_cambio when provided for a foreign-currency instrument', async () => {
    render(<MovimientoForm carteraId={1} />)
    await fillCommonFields('JP3242800005')
    fireEvent.change(screen.getByPlaceholderText('1.08 (USD/EUR)'), { target: { value: '179.2' } })

    fireEvent.click(screen.getByRole('button', { name: 'Guardar movimiento' }))

    await waitFor(() => expect(crearMovimientoMock).toHaveBeenCalledWith(
      expect.objectContaining({ isin: 'JP3242800005', tipo_cambio: 179.2 }),
    ))
  })

  it('does not require tipo_cambio for a EUR-denominated instrument', async () => {
    render(<MovimientoForm carteraId={1} />)
    await fillCommonFields('ES0148396007')

    fireEvent.click(screen.getByRole('button', { name: 'Guardar movimiento' }))

    await waitFor(() => expect(crearMovimientoMock).toHaveBeenCalledWith(
      expect.objectContaining({ isin: 'ES0148396007', tipo_cambio: undefined }),
    ))
  })
})
