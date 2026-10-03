'use client'
import { usePreferences, type Density } from '@/lib/preferences'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'comfortable', label: 'Cómoda' },
  { value: 'compact', label: 'Compacta' },
]

export function VistaSection() {
  const { privacy, density, setPrivacy, setDensity } = usePreferences()

  return (
    <div className="card p-5 max-w-md space-y-5">
      <p className="section-label">Vista</p>

      {/* Modo privacidad */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--color-ink)' }}>
            Modo privacidad
          </p>
          <p className="text-[12px]" style={{ color: 'var(--color-muted)' }}>
            Oculta los importes de la cartera
          </p>
        </div>
        <button
          role="switch"
          aria-checked={privacy}
          aria-label="Modo privacidad"
          onClick={() => setPrivacy(!privacy)}
          className="relative w-9 h-5 rounded-full transition-colors shrink-0"
          style={{ background: privacy ? 'var(--color-primary)' : 'var(--color-border)' }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{ transform: privacy ? 'translateX(16px)' : 'translateX(0)' }}
          />
        </button>
      </div>

      {/* Densidad */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium" style={{ color: 'var(--color-ink)' }}>
            Densidad
          </p>
          <p className="text-[12px]" style={{ color: 'var(--color-muted)' }}>
            Espaciado de las filas en las tablas
          </p>
        </div>
        <SegmentedControl options={DENSITY_OPTIONS} value={density} onChange={setDensity} aria-label="Densidad" />
      </div>
    </div>
  )
}
