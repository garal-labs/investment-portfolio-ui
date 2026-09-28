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

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const displayName = user?.nombre || user?.email || 'Cargando...'

  return (
    <>
      {/* Backdrop (mobile/tablet only, shown when drawer is open) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[200px] min-h-screen flex flex-col shrink-0 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--color-sidebar)' }}
      >
        {/* Logo */}
        <div
          className="px-5 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,.14)' }}
        >
          <div className="font-serif text-[19px] font-bold text-white tracking-tight truncate">
            {displayName}
          </div>
          <div className="font-lora italic text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,.65)' }}>
            mi cartera
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3.5 flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                  active
                    ? 'bg-[var(--color-sidebar-active)] text-white font-medium'
                    : 'text-white/70 font-normal hover:bg-[var(--color-sidebar-hover)] hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-5 py-3.5"
          style={{ borderTop: '1px solid rgba(255,255,255,.12)' }}
        >
          <p
            className="text-[10px] font-bold tracking-[.12em] uppercase"
            style={{ color: 'rgba(255,255,255,.4)' }}
          >
            Garal Cartera v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
