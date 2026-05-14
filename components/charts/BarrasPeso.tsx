import { CHART_COLORS } from '@/lib/utils'
import type { GrupoAnalisis } from '@/types'

interface BarrasPesoProps {
  data: GrupoAnalisis[]
  title: string
}

export function BarrasPeso({ data, title }: BarrasPesoProps) {
  return (
    <div className="card p-4">
      <p className="section-label">{title}</p>
      <div className="space-y-2.5">
        {data.map((item, i) => (
          <div key={item.nombre} className="flex items-center gap-3">
            <span
              className="text-xs w-28 text-right shrink-0 truncate"
              style={{ color: 'var(--color-muted)' }}
            >
              {item.nombre}
            </span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--color-border)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${item.peso_pct}%`,
                  background: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
            </div>
            <span
              className="text-xs font-medium w-9 text-right shrink-0"
              style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
            >
              {item.peso_pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
