import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import { AuthProvider } from './AuthContext'
import { CarteraProvider, useActiveCartera } from './CarteraContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// `CarteraProvider` gates its query on `useAuth()`'s `user`, so it now
// needs an `AuthProvider` ancestor — matches the real nesting in
// `app/providers.tsx`. The default `/auth/me` MSW handler resolves to a
// logged-in demo user, satisfying the gate once it settles.
function renderWithProvider(ui: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CarteraProvider>{ui}</CarteraProvider>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

function Probe() {
  const { carteraId, carteras, isLoading } = useActiveCartera()
  if (isLoading) return <span>loading</span>
  return (
    <span>
      active:{carteraId ?? 'none'} count:{carteras.length}
    </span>
  )
}

describe('CarteraContext — selection', () => {
  it('restores the previously selected cartera when it is still present', async () => {
    server.use(
      http.get('/api/v1/carteras', () =>
        HttpResponse.json([
          { id: 1, nombre: 'Cartera principal', created_at: '2024-01-01T00:00:00Z' },
          { id: 2, nombre: 'Cartera secundaria', created_at: '2024-01-01T00:00:00Z' },
        ])),
    )
    window.localStorage.setItem('active_cartera_id', '2')

    renderWithProvider(<Probe />)

    await waitFor(() => expect(screen.getByText('active:2 count:2')).toBeInTheDocument())
  })

  it('falls back to the first cartera when the remembered one no longer exists', async () => {
    server.use(
      http.get('/api/v1/carteras', () =>
        HttpResponse.json([
          { id: 1, nombre: 'Cartera principal', created_at: '2024-01-01T00:00:00Z' },
        ])),
    )
    window.localStorage.setItem('active_cartera_id', '99')

    renderWithProvider(<Probe />)

    await waitFor(() => expect(screen.getByText('active:1 count:1')).toBeInTheDocument())
  })
})

describe('CarteraContext — zero-cartera behavior', () => {
  it('keeps carteraId null instead of falling back to a fake id', async () => {
    server.use(http.get('/api/v1/carteras', () => HttpResponse.json([])))

    renderWithProvider(<Probe />)

    await waitFor(() => expect(screen.getByText('active:none count:0')).toBeInTheDocument())
  })
})
