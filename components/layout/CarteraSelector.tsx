'use client'
import { useActiveCartera } from '@/contexts/CarteraContext'

// Renders next to the refresh button in `Topbar`. Hides itself while
// loading and when the user has no carteras yet — pages own the
// "no cartera" empty state (portfolio-selection spec).
export function CarteraSelector() {
  const { carteraId, setCarteraId, carteras, isLoading } = useActiveCartera()

  if (isLoading || carteras.length === 0) return null

  return (
    <select
      aria-label="Cartera activa"
      value={carteraId ?? ''}
      onChange={e => setCarteraId(Number(e.target.value))}
      className="text-[12px] font-medium rounded-lg px-2.5 py-1.5 outline-none"
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-ink)',
      }}
    >
      {carteras.map(c => (
        <option key={c.id} value={c.id}>
          {c.nombre}
        </option>
      ))}
    </select>
  )
}
