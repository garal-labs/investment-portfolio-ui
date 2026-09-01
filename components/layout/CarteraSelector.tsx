'use client'
import { useState } from 'react'
import { useActiveCartera } from '@/contexts/CarteraContext'
import { ChevronDown } from 'lucide-react'

export function CarteraSelector({ fallbackTitle }: { fallbackTitle?: string }) {
  const { carteraId, setCarteraId, carteras, isLoading } = useActiveCartera()
  const [open, setOpen] = useState(false)


  if (isLoading || carteras.length === 0) {
    return (
      <h1 className="font-serif text-[15px] font-bold truncate" style={{ color: 'var(--color-ink)' }}>
        {fallbackTitle || 'Cargando...'}
      </h1>
    )
  }

  const active = carteras.find(c => c.id === carteraId)

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 font-serif text-[15px] font-bold outline-none cursor-pointer hover:opacity-80 transition-opacity max-w-full"
        style={{ color: 'var(--color-ink)' }}
      >
        <span className="truncate">{active?.nombre || 'Seleccionar cartera'}</span>
        <ChevronDown size={14} style={{ color: 'var(--color-muted)', marginTop: 2 }} className="shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} />
      )}

      {open && (
        <div className="card absolute left-0 top-full mt-2 py-1.5 z-10 min-w-[180px] shadow-sm">
          {carteras.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setCarteraId(c.id)
                setOpen(false)
              }}
              className="w-full text-left px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-[rgba(45,106,90,0.06)]"
              style={{
                color: c.id === carteraId ? 'var(--color-primary)' : 'var(--color-ink)',
              }}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
