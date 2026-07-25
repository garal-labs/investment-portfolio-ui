import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import { AuthProvider, useAuth } from './AuthContext'
import { CarteraProvider, useActiveCartera } from './CarteraContext'

const replace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
}))

// Mirrors `app/providers.tsx`: a single QueryClient, with AuthProvider and
// CarteraProvider both mounted once for the whole app lifetime — neither
// unmounts across a logout → login transition (they live in the root
// layout, not inside a page that gets swapped by navigation).
function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CarteraProvider>
          <Dashboard />
        </CarteraProvider>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

function Dashboard() {
  const { user, login, logout } = useAuth()
  const { carteras, isLoading: carterasLoading } = useActiveCartera()

  return (
    <div>
      <span>{user ? `logged-in:${user.email}` : 'anonymous'}</span>
      <span>
        carteras:{carterasLoading ? 'loading' : (carteras.map(c => c.nombre).join(',') || 'none')}
      </span>
      <button onClick={() => logout()}>logout</button>
      <button onClick={() => login({ email: 'b@example.com', password: 'x' })}>login-b</button>
    </div>
  )
}

describe('Logout clears user-scoped cache (cross-user cartera leak — CRITICAL fix)', () => {
  it('never renders user A cartera data once user B is logged in', async () => {
    server.use(
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json({ id: 1, email: 'a@example.com', nombre: 'A', created_at: '2024-01-01T00:00:00Z' })),
      http.get('/api/v1/carteras', () =>
        HttpResponse.json([{ id: 1, nombre: 'Cartera de A', created_at: '2024-01-01T00:00:00Z' }])),
    )

    renderApp()

    await waitFor(() => expect(screen.getByText('logged-in:a@example.com')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('carteras:Cartera de A')).toBeInTheDocument())

    // User A logs out. The backend session actually terminates, so any
    // refetch of a protected/user-scoped endpoint after this point 401s —
    // MSW must mirror that, otherwise a post-logout refetch would just
    // return user A's data again and the test wouldn't exercise the real
    // scenario (a stale mounted query surviving into a *different* user).
    server.use(
      http.post('/api/v1/auth/logout', () => HttpResponse.json({ ok: true })),
      http.get('/api/v1/auth/me', () => HttpResponse.json({ detail: 'unauthorized' }, { status: 401 })),
      http.get('/api/v1/carteras', () => HttpResponse.json({ detail: 'unauthorized' }, { status: 401 })),
    )
    screen.getByText('logout').click()
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument())
    expect(screen.queryByText(/Cartera de A/)).not.toBeInTheDocument()

    // User B logs in — different /auth/me and /carteras responses, but the
    // SAME numeric cartera id as user A's (worst case for a stale-cache
    // rendering leak, since a lingering `carteraId` selection would still
    // "match" this id after a naive fix).
    server.use(
      http.post('/api/v1/auth/login', () => HttpResponse.json({ ok: true })),
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json({ id: 2, email: 'b@example.com', nombre: 'B', created_at: '2024-01-01T00:00:00Z' })),
      http.get('/api/v1/carteras', () =>
        HttpResponse.json([{ id: 1, nombre: 'Cartera de B', created_at: '2024-01-01T00:00:00Z' }])),
    )
    screen.getByText('login-b').click()

    await waitFor(() => expect(screen.getByText('logged-in:b@example.com')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('carteras:Cartera de B')).toBeInTheDocument())

    // At no point — before or after the login-as-B transition — did the
    // dashboard render user A's stale cartera name.
    expect(screen.queryByText(/Cartera de A/)).not.toBeInTheDocument()
  })
})
