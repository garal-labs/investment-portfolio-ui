'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const NAV = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const displayName = user?.nombre || user?.email || 'Cargando...'

  return (
    <aside
      className="w-[188px] min-h-screen flex flex-col shrink-0"
      style={{ background: 'var(--color-sidebar)' }}
    >
      {/* Logo */}
      <div
        className="px-[18px] py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,.15)' }}
      >
        <div className="font-serif text-[18px] font-bold text-white tracking-tight truncate">
          {displayName}
        </div>
        <div className="font-lora italic text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,.65)' }}>
          mi cartera
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-[18px] py-2.5 text-[12px] transition-colors"
              style={{
                color: active ? '#fff' : 'rgba(255,255,255,.55)',
                fontWeight: active ? 500 : 400,
                background: active ? 'rgba(255,255,255,.18)' : 'transparent',
                borderRight: active ? '2px solid #fff' : '2px solid transparent',
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-[18px] py-3.5"
        style={{ borderTop: '1px solid rgba(255,255,255,.12)' }}
      >
        <p
          className="text-[9px] font-bold tracking-[.12em] uppercase"
          style={{ color: 'rgba(255,255,255,.4)' }}
        >
          Garal Cartera v1.0
        </p>
      </div>
    </aside>
  )
}
