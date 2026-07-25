'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthCard } from '@/components/auth/AuthCard'
import { getErrorMessage } from '@/lib/utils'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login({ email, password })
      router.push('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, 'Email o contraseña incorrectos'))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Accedé a tu cartera de inversión"
      footer={{ text: '¿No tenés cuenta?', linkText: 'Registrate', href: '/register' }}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
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
          Entrar
        </button>
        <p className="text-[12px] text-center">
          <Link href="/forgot-password" style={{ color: 'var(--color-muted)' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
