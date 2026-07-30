'use client'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useCrearCartera } from '@/hooks/useCartera'
import { useActiveCartera } from '@/contexts/CarteraContext'

// Renders next to `CarteraSelector` in `Topbar`. Opens an inline popover
// with a minimal form (only `nombre` is required by `CarteraCreate`).
export function CrearCarteraButton() {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const { setCarteraId } = useActiveCartera()
  const { mutateAsync: crearCartera, isPending } = useCrearCartera()

  function handleClose() {
    setOpen(false)
    setNombre('')
    setError('')
  }

  async function handleSubmit() {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    try {
      const nueva = await crearCartera({ nombre: nombre.trim() })
      setCarteraId(nueva.id)
      handleClose()
    } catch {
      setError('Error al crear la cartera')
    }
  }

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-[9px] font-bold tracking-[.12em] uppercase rounded-full px-2.5 py-[3px] transition-colors hover:bg-[rgba(196,149,106,0.1)]"
        style={{
          color: 'var(--color-amber)',
          border: '1px solid rgba(196,149,106,.35)',
          background: 'var(--color-bg)',
        }}
        title="Nueva cartera"
      >
        {open ? 'Cerrar' : 'Nueva Cartera'}
      </button>

      {open && (
        <div
          className="card absolute right-0 top-full mt-2 p-4 z-10"
          style={{ width: 240 }}
        >
          <p className="section-label mb-2">Nueva cartera</p>
          <input
            autoFocus
            className="input-dark w-full"
            placeholder="Nombre de la cartera"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {error && (
            <p className="text-xs mt-1.5 font-lora italic" style={{ color: 'var(--color-plum)' }}>
              {error}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="btn-primary w-full mt-3"
          >
            {isPending ? 'Creando...' : 'Crear cartera'}
          </button>
        </div>
      )}
    </div>
  )
}
