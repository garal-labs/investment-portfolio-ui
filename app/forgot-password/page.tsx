'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthCard } from '@/components/auth/AuthCard'
import { getErrorMessage } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo procesar la solicitud'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Te enviamos un enlace para restablecerla"
      footer={{ text: '¿La recordaste?', linkText: 'Iniciá sesión', href: '/login' }}
    >
      {sent ? (
        <p className="text-[13px]" style={{ color: 'var(--color-ink-2)' }}>
          Si el email existe en nuestro sistema, vas a recibir un enlace para restablecer tu contraseña.
        </p>
      ) : (
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
          {error && (
            <p className="text-[12px]" style={{ color: 'var(--color-plum)' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Enviar enlace
          </button>
        </form>
      )}
    </AuthCard>
  )
}
