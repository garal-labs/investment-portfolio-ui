import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import { AuthProvider } from '@/contexts/AuthContext'
import RegisterPage from './page'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}))

function renderRegisterPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('RegisterPage', () => {
  afterEach(() => push.mockClear())

  it('sends the entered nombre to the register endpoint and redirects on success', async () => {
    let receivedBody: unknown
    server.use(
      http.post('/api/v1/auth/register', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ ok: true })
      }),
    )
    renderRegisterPage()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ada Lovelace' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'super-secret-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'))
    expect(receivedBody).toMatchObject({ nombre: 'Ada Lovelace', email: 'ada@example.com' })
  })

  it('shows an inline error and stays on the page when registration fails', async () => {
    server.use(
      http.post('/api/v1/auth/register', () =>
        HttpResponse.json({ detail: 'El email ya está en uso' }, { status: 409 })),
    )
    renderRegisterPage()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'super-secret-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('El email ya está en uso')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })
})
