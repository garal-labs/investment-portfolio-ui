import Link from 'next/link'

interface AuthCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: { text: string; linkText: string; href: string }
}

// Shared shell for /login, /register, /forgot-password, /reset-password —
// keeps the four auth pages visually consistent without duplicating the
// centered-card layout in each one.
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="card p-6 w-full max-w-sm">
        <h1 className="font-serif text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
          {title}
        </h1>
        <p className="font-lora italic text-[12px] mt-1 mb-4" style={{ color: 'var(--color-muted)' }}>
          {subtitle ?? '\u00A0'}
        </p>
        {children}
        {footer && (
          <p className="text-[12px] mt-4 text-center" style={{ color: 'var(--color-muted)' }}>
            {footer.text}{' '}
            <Link href={footer.href} className="font-medium" style={{ color: 'var(--color-primary)' }}>
              {footer.linkText}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
