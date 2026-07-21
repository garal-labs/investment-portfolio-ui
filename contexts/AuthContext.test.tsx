import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import api from '@/lib/api'
import { AuthProvider, useAuth } from './AuthContext'

const replace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
}))

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>,
  )
}

function Probe() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <span>loading</span>
  return <span>{user ? `logged-in:${user.email}` : 'anonymous'}</span>
}

describe('AuthContext — /auth/me bootstrap', () => {
  it('populates the user from GET /auth/me on mount', async () => {
    renderWithProviders(<Probe />)
    await waitFor(() => expect(screen.getByText('logged-in:demo@example.com')).toBeInTheDocument())
  })

  it('treats a 401 from /auth/me as "not logged in", not an error', async () => {
    server.use(http.get('/api/v1/auth/me', () => HttpResponse.json({ detail: 'unauthorized' }, { status: 401 })))
    renderWithProviders(<Probe />)
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument())
    expect(replace).not.toHaveBeenCalled()
  })
})

describe('AuthContext — logout', () => {
  it('clears the cached user and redirects to /login', async () => {
    function LogoutProbe() {
      const { user, logout } = useAuth()
      return (
        <div>
          <span>{user ? `logged-in:${user.email}` : 'anonymous'}</span>
          <button onClick={() => logout()}>logout</button>
        </div>
      )
    }
    server.use(http.post('/api/v1/auth/logout', () => HttpResponse.json({ ok: true })))
    const { getByText } = renderWithProviders(<LogoutProbe />)
    await waitFor(() => expect(getByText('logged-in:demo@example.com')).toBeInTheDocument())

    getByText('logout').click()
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
    expect(getByText('anonymous')).toBeInTheDocument()
  })
})

describe('AuthContext — protected 401 recovery', () => {
  it('redirects to /login when a protected-resource request gets a 401', async () => {
    server.use(http.get('/api/v1/carteras', () => HttpResponse.json({ detail: 'unauthorized' }, { status: 401 })))
    renderWithProviders(<Probe />)
    await waitFor(() => expect(screen.getByText('logged-in:demo@example.com')).toBeInTheDocument())

    await expect(api.get('/carteras')).rejects.toBeTruthy()
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
  })
})
