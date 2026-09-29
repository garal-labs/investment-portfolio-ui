'use client'
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/SegmentedControl'
import { usePreferences } from '@/lib/preferences'
import { formatEur, formatPct, maskAmount, signRent } from '@/lib/utils'
import type { RentabilidadCartera } from '@/types'

export type PeriodoSeleccionado = 'total' | '1m' | '3m' | '6m' | 'ytd' | '1y'

export const PERIODO_DESCRIPCION: Record<PeriodoSeleccionado, string> = {
  total: 'desde la primera compra',
  '1m': 'último mes',
  '3m': 'últimos 3 meses',
  '6m': 'últimos 6 meses',
  ytd: 'en lo que va de año',
  '1y': 'último año',
}

const PERIODO_OPTIONS: SegmentedControlOption<PeriodoSeleccionado>[] = [
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: 'ytd', label: 'YTD' },
  { value: '1y', label: '1A' },
  { value: 'total', label: 'Total' },
]

export interface HeroValues {
  plus: number
  pct: number
  sub: string
}

interface HeroResumen {
  valor_total: number
  coste_total: number
}

// Total = valor actual − coste (no historical data needed). Other periods
// need the backend's period-scoped rentabilidad; null means "not available
// yet" (loading, or degraded — caller decides which via unavailablePeriods).
export function computeHero(
  resumen: HeroResumen,
  periodo: PeriodoSeleccionado,
  rentabilidad?: RentabilidadCartera,
): HeroValues | null {
  if (periodo === 'total') {
    const plus = resumen.valor_total - resumen.coste_total
    const pct = resumen.coste_total > 0 ? (resumen.valor_total / resumen.coste_total - 1) * 100 : 0
    return { plus, pct, sub: PERIODO_DESCRIPCION.total }
  }
  if (!rentabilidad) return null
  return { plus: rentabilidad.plusvalia_total, pct: rentabilidad.rentabilidad_pct, sub: PERIODO_DESCRIPCION[periodo] }
}

// A period is degraded when garal-screener could not price any of the
// positions it needed for that window (tickers_sin_dato covers every
// position) — showing a number in that case would be wrong, not just stale.
export function isPeriodoDegradado(rentabilidad: Pick<RentabilidadCartera, 'posiciones' | 'tickers_sin_dato'>): boolean {
  return rentabilidad.posiciones.length > 0 && rentabilidad.tickers_sin_dato.length >= rentabilidad.posiciones.length
}

export interface ValueBlockProps {
  resumen: HeroResumen & { plusvalia_realizada: number }
  periodo: PeriodoSeleccionado
  onPeriodoChange: (periodo: PeriodoSeleccionado) => void
  rentabilidad?: RentabilidadCartera
  unavailablePeriods?: PeriodoSeleccionado[]
}

export function ValueBlock({
  resumen,
  periodo,
  onPeriodoChange,
  rentabilidad,
  unavailablePeriods = [],
}: ValueBlockProps) {
  const { privacy } = usePreferences()
  const hero = computeHero(resumen, periodo, rentabilidad)
  const positive = (hero?.plus ?? 0) >= 0
  const color = positive ? '#2D6A5A' : '#8a3a6a'
  const pillBg = positive ? '#eaf2ee' : '#f6ebf1'

  const options = PERIODO_OPTIONS.map(o => ({
    ...o,
    disabled: o.value !== 'total' && unavailablePeriods.includes(o.value),
  }))

  function plain(value: number) {
    return privacy ? maskAmount('EUR') : formatEur(value)
  }
  function signed(value: number) {
    return privacy ? maskAmount('EUR') : `${signRent(value)}${formatEur(value)}`
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-8 lg:items-end">
      <div className="flex flex-col gap-3 min-w-0">
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#a09080' }}>
          Valor de la cartera
        </p>
        <p className="font-serif" style={{ fontSize: 60, lineHeight: 1, fontWeight: 700, letterSpacing: '-.02em' }}>
          {plain(resumen.valor_total)}
        </p>
        {hero && (
          <div className="flex items-baseline gap-3 flex-wrap">
            <span style={{ fontSize: 20, fontWeight: 700, color }}>{signed(hero.plus)}</span>
            <span style={{ fontSize: 15, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: pillBg, color }}>
              {formatPct(hero.pct)}
            </span>
            <span className="font-lora italic" style={{ fontSize: 14, color: '#a09080' }}>
              {hero.sub}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-[18px]">
        <SegmentedControl options={options} value={periodo} onChange={onPeriodoChange} aria-label="Periodo" />
        <div className="flex gap-8">
          <div className="flex flex-col gap-[3px] items-end">
            <p style={{ fontSize: 12, color: '#a09080' }}>Invertido</p>
            <p style={{ fontSize: 16, fontWeight: 500 }}>{plain(resumen.coste_total)}</p>
          </div>
          <div className="flex flex-col gap-[3px] items-end">
            <p style={{ fontSize: 12, color: '#a09080' }}>Plusvalía realizada</p>
            <p style={{ fontSize: 16, fontWeight: 500 }}>{signed(resumen.plusvalia_realizada)}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
