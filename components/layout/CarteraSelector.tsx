'use client'
import { useActiveCartera } from '@/contexts/CarteraContext'

export function CarteraSelector({ fallbackTitle }: { fallbackTitle?: string }) {
  const { carteraId, setCarteraId, carteras, isLoading } = useActiveCartera()

  if (isLoading || carteras.length === 0) {
    return (
      <h1 className="font-serif text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>
        {fallbackTitle || 'Cargando...'}
      </h1>
    )
  }

  return (
    <select
      aria-label="Cartera activa"
      value={carteraId ?? ''}
      onChange={e => setCarteraId(Number(e.target.value))}
      className="font-serif text-[15px] font-bold outline-none cursor-pointer"
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--color-ink)',
        padding: 0,
      }}
    >  {carteras.map(c => (
        <option key={c.id} value={c.id} style={{ color: 'var(--color-ink)', background: 'var(--color-surface)' }}>
          {c.nombre}
        </option>
      ))}
    </select>
  )
}
