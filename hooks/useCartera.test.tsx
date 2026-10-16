import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import {
  useActualizarInstrumento,
  useCrearMovimiento,
  useEliminarMovimiento,
  useFronteraEficiente,
} from './useCartera'

// Mirrors the app default (`retry: 1` in `app/providers.tsx`) so retry
// behavior is exercised as in production, without the backoff delay.
function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

function countFronteraRequests(status: number, body: Record<string, unknown>) {
  const calls = { count: 0 }
  server.use(
    http.get('/api/v1/carteras/:id/markowitz', () => {
      calls.count += 1
      return HttpResponse.json(body, { status })
    }),
  )
  return calls
}

describe('useFronteraEficiente', () => {
  it('fetches the frontier for the given cartera and years', async () => {
    const { wrapper } = setup()
    const { result } = renderHook(() => useFronteraEficiente(1, 5), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.tickers).toEqual(['AAPL', 'MSFT', 'SAN.MC'])
  })

  it('stays idle without requesting when there is no active cartera', async () => {
    const calls = countFronteraRequests(200, {})
    const { wrapper } = setup()
    const { result } = renderHook(() => useFronteraEficiente(null, 5), { wrapper })

    await new Promise(resolve => setTimeout(resolve, 20))
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
    expect(calls.count).toBe(0)
  })

  it.each([400, 404, 503])('does not retry deterministic %i errors', async (status) => {
    const calls = countFronteraRequests(status, { detail: 'error' })
    const { wrapper } = setup()
    const { result } = renderHook(() => useFronteraEficiente(1, 5), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(calls.count).toBe(1)
  })

  it('keeps the default single retry for transient errors', async () => {
    const calls = countFronteraRequests(500, { detail: 'boom' })
    const { wrapper } = setup()
    const { result } = renderHook(() => useFronteraEficiente(1, 5), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(calls.count).toBe(2)
  })
})

describe('movement/instrument mutations invalidate the frontier', () => {
  it('useCrearMovimiento invalidates the frontier of the movement cartera', async () => {
    server.use(http.post('/api/v1/movimientos', () => HttpResponse.json({ id: 1 }, { status: 201 })))
    const { queryClient, wrapper } = setup()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCrearMovimiento(), { wrapper })

    await act(() =>
      result.current.mutateAsync({
        cartera_id: 3, isin: 'US0378331005', tipo: 'compra', fecha: '2026-10-01', cantidad: 1, precio: 100,
      }),
    )

    expect(spy).toHaveBeenCalledWith({ queryKey: ['frontera', 3] })
  })

  it('useEliminarMovimiento invalidates the frontier of the given cartera', async () => {
    server.use(http.delete('/api/v1/movimientos/:id', () => new HttpResponse(null, { status: 204 })))
    const { queryClient, wrapper } = setup()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useEliminarMovimiento(4), { wrapper })

    await act(() => result.current.mutateAsync(10))

    expect(spy).toHaveBeenCalledWith({ queryKey: ['frontera', 4] })
  })

  it('useActualizarInstrumento invalidates every frontier', async () => {
    server.use(http.patch('/api/v1/instrumentos/:id', () => HttpResponse.json({ id: 1, isin: 'X' })))
    const { queryClient, wrapper } = setup()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useActualizarInstrumento(), { wrapper })

    await act(() => result.current.mutateAsync({ id: 1, data: { ticker: 'AAPL' } }))

    expect(spy).toHaveBeenCalledWith({ queryKey: ['frontera'] })
  })

  it('frontier invalidation by cartera prefix covers every `anios` variant', async () => {
    const { queryClient } = setup()
    queryClient.setQueryData(['frontera', 4, 3], { stale: false })
    queryClient.setQueryData(['frontera', 4, 5], { stale: false })
    queryClient.setQueryData(['frontera', 5, 5], { stale: false })

    await queryClient.invalidateQueries({ queryKey: ['frontera', 4] })

    const invalidated = (key: unknown[]) => queryClient.getQueryState(key)?.isInvalidated
    expect(invalidated(['frontera', 4, 3])).toBe(true)
    expect(invalidated(['frontera', 4, 5])).toBe(true)
    expect(invalidated(['frontera', 5, 5])).toBe(false)
  })
})
