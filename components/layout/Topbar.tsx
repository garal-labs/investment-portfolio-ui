'use client'
import { RefreshCw, LogOut } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useActiveCartera } from '@/contexts/CarteraContext'
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
      className="h-14 px-5 flex items-center justify-between shrink-0"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div>
        {typeof title === 'string' ? (
          <h1 className="font-serif text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>
            {title}
          </h1>
        ) : (
          title
        )}
        {subtitle && (
          <p className="font-lora italic text-[11px] mt-px" style={{ color: 'var(--color-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <CrearCarteraButton />
        {carteraId != null && (
          <span
            className="text-[9px] font-bold tracking-[.12em] uppercase rounded-full px-2.5 py-[3px]"
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
