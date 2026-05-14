'use client'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

interface TopbarProps {
  title: string
  subtitle?: string
  carteraId?: number
}

export function Topbar({ title, subtitle, carteraId }: TopbarProps) {
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const [minutos, setMinutos] = useState(0)

  // Contador "Actualizado · X min"
  useEffect(() => {
    const t = setInterval(() => setMinutos(m => m + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    if (carteraId) {
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
        <h1 className="font-serif text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="font-lora italic text-[11px] mt-px" style={{ color: 'var(--color-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {carteraId && (
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
      </div>
    </header>
  )
}
