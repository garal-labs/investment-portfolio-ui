import { Suspense } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { ResetPasswordForm } from './ResetPasswordForm'

// `ResetPasswordForm` reads the `token` search param via `useSearchParams`,
// which requires a Suspense boundary for static builds — see
// node_modules/next/dist/docs/.../use-search-params.md ("Missing Suspense
// boundary" build error otherwise).
export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Restablecer contraseña"
      subtitle="Elegí una nueva contraseña"
      footer={{ text: '¿La recordaste?', linkText: 'Iniciá sesión', href: '/login' }}
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  )
}
