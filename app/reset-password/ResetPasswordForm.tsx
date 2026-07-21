'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/utils'

export function ResetPasswordForm() {
  const { resetPassword } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setError('Enlace de restablecimiento inválido o incompleto')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await resetPassword({ token, password })
      router.push('/login')
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo restablecer la contraseña'))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="password" className="section-label">Nueva contraseña</label>
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
        Restablecer contraseña
      </button>
    </form>
  )
}
