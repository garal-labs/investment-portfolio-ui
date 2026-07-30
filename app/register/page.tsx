'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthCard } from '@/components/auth/AuthCard'
import { getErrorMessage } from '@/lib/utils'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      // `POST /auth/register` only creates the account — it does not set
      // the session cookie, so pushing straight to a protected route just
      // bounces back to `/login` via proxy.ts. Send the user to log in
      // with their new credentials instead.
      await register({ email, password, nombre: nombre || undefined })
      router.push('/login')
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la cuenta'))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="Empezá a llevar el control de tu cartera"
      footer={{ text: '¿Ya tenés cuenta?', linkText: 'Iniciá sesión', href: '/login' }}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="nombre" className="section-label">Nombre</label>
          <input
            id="nombre"
            className="input-dark"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email" className="section-label">Email</label>
          <input
            id="email"
            type="email"
            className="input-dark"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="section-label">Contraseña</label>
          <input
            id="password"
            type="password"
            className="input-dark"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && (
          <p className="text-[12px]" style={{ color: 'var(--color-plum)' }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Crear cuenta
        </button>
      </form>
    </AuthCard>
  )
}
