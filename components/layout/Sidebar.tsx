'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ChartScatter,
  ArrowLeftRight,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebarCollapsed } from '@/lib/sidebar-state'

const NAV = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/markowitz', label: 'Markowitz', icon: ChartScatter },
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
  const { collapsed, toggle } = useSidebarCollapsed()
  // Width animates only on a user toggle, never when a reload hydrates the
  // stored state.
  const [animarAncho, setAnimarAncho] = useState(false)
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
  // Collapsing only applies from the lg breakpoint, where the sidebar is
  // static; the mobile drawer always shows the full menu.
  const hideWhenCollapsed = collapsed ? 'lg:sr-only' : ''

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
        data-collapsed={collapsed}
        className={`fixed inset-y-0 left-0 z-50 w-[200px] min-h-screen flex flex-col shrink-0 ${animarAncho ? 'transition-[transform,width]' : 'transition-transform'} duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          collapsed ? 'lg:w-[64px]' : 'lg:w-[200px]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--color-sidebar)' }}
      >
        {/* Logo */}
        <div
          className={`px-5 pt-6 pb-5 ${collapsed ? 'lg:px-2' : ''}`}
          style={{ borderBottom: '1px solid rgba(255,255,255,.14)' }}
        >
          {/* Collapse toggle sits in the header's top-right corner; on the
              narrow collapsed rail it stacks above the initials instead. */}
          <div className={`flex items-start gap-2 ${collapsed ? 'lg:flex-col-reverse lg:items-center lg:gap-3' : ''}`}>
            {collapsed && (
              <div
                className="hidden lg:block font-serif text-[19px] font-bold text-white text-center"
                title={displayName}
              >
                {initials}
              </div>
            )}
            <div className={`flex-1 min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="font-serif text-[19px] font-bold text-white tracking-tight truncate">
                {displayName}
              </div>
              <div className="font-lora italic text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,.65)' }}>
                mi cartera
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAnimarAncho(true)
                toggle()
              }}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
              title={collapsed ? 'Expandir menú' : 'Contraer menú'}
              className="hidden lg:flex shrink-0 items-center justify-center p-1.5 rounded-md text-white/70 hover:bg-[var(--color-sidebar-hover)] hover:text-white transition-colors"
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3.5 flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                  collapsed ? 'lg:justify-center' : ''
                } ${
                  active
                    ? 'bg-[var(--color-sidebar-active)] text-white font-medium'
                    : 'text-white/70 font-normal hover:bg-[var(--color-sidebar-hover)] hover:text-white'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className={`truncate ${hideWhenCollapsed}`}>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className={`px-5 py-3.5 ${collapsed ? 'lg:px-2' : ''}`}
          style={{ borderTop: '1px solid rgba(255,255,255,.12)' }}
        >
          <p
            className={`text-[10px] font-bold tracking-[.12em] uppercase ${collapsed ? 'lg:hidden' : ''}`}
            style={{ color: 'rgba(255,255,255,.4)' }}
          >
            Garal Cartera v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
