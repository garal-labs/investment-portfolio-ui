'use client'
import { RefreshCw, LogOut, Menu } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useActiveCartera } from '@/contexts/CarteraContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { CrearCarteraButton } from './CrearCarteraButton'
import { ReactNode } from 'react'

interface TopbarProps {
  title: ReactNode
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const qc = useQueryClient()
  const { logout } = useAuth()
  const { carteraId } = useActiveCartera()
  const { toggle } = useSidebar()
  const [refreshing, setRefreshing] = useState(false)
  const [minutos, setMinutos] = useState(0)

  // Contador "Actualizado · X min"
  useEffect(() => {
    const t = setInterval(() => setMinutos(m => m + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    if (carteraId != null) {
      await qc.invalidateQueries({ queryKey: ['resumen', carteraId] })
      await qc.invalidateQueries({ queryKey: ['analisis', carteraId] })
    }
    setMinutos(0)
    setTimeout(() => setRefreshing(false), 800)
  }

  const updatedLabel = minutos === 0 ? 'Actualizado · ahora' : `Actualizado · ${minutos} min`

  return (
    <header
      className="h-14 px-5 flex items-center justify-between gap-2 shrink-0"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggle}
          className="p-1 -ml-1 transition-colors md:hidden shrink-0"
          style={{ color: 'var(--color-muted)' }}
          title="Abrir menú"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          {typeof title === 'string' ? (
            <h1 className="font-serif text-[15px] font-bold truncate" style={{ color: 'var(--color-ink)' }}>
              {title}
            </h1>
          ) : (
            title
          )}
          {subtitle && (
            <p className="font-lora italic text-[11px] mt-px truncate" style={{ color: 'var(--color-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <CrearCarteraButton />
        {carteraId != null && (
          <span
            className="hidden sm:inline-block text-[9px] font-bold tracking-[.12em] uppercase rounded-full px-2.5 py-[3px]"
            style={{
              color: 'var(--color-amber)',
              border: '1px solid rgba(196,149,106,.35)',
            }}
          >
            {updatedLabel}
          </span>
        )}
        <button
          onClick={handleRefresh}
          className="p-1 transition-colors"
          style={{ color: 'var(--color-muted)' }}
          title="Actualizar precios"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={() => logout()}
          className="p-1 transition-colors"
          style={{ color: 'var(--color-muted)' }}
          title="Cerrar sesión"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}
