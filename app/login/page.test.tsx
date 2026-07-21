import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import { AuthProvider } from '@/contexts/AuthContext'
import LoginPage from './page'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}))

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  it('shows an inline error and stays on the page when credentials are rejected', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json({ detail: 'Credenciales inválidas' }, { status: 401 })),
    )
    renderLoginPage()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'demo@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it('redirects to /dashboard on a successful login', async () => {
    server.use(http.post('/api/v1/auth/login', () => HttpResponse.json({ ok: true })))
    renderLoginPage()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'demo@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'correct-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'))
  })
})
