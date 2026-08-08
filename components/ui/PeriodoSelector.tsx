import type { PeriodoRentabilidad } from '@/types'

export type PeriodoSeleccionado = 'total' | PeriodoRentabilidad

const OPCIONES: { value: PeriodoSeleccionado; label: string }[] = [
  { value: 'total', label: 'Total' },
  { value: '1m', label: '1M' },
  { value: '2m', label: '2M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: 'ytd', label: 'YTD' },
  { value: '1y', label: '1A' },
  { value: '2y', label: '2A' },
  { value: '3y', label: '3A' },
]

interface PeriodoSelectorProps {
  value: PeriodoSeleccionado
  onChange: (periodo: PeriodoSeleccionado) => void
}

export function PeriodoSelector({ value, onChange }: PeriodoSelectorProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {OPCIONES.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors"
          style={{
            background: value === o.value ? 'var(--color-primary)' : 'transparent',
            color: value === o.value ? '#fff' : 'var(--color-ink-2)',
            border: `1px solid ${value === o.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
