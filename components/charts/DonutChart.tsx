'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CHART_COLORS } from '@/lib/utils'
import type { GrupoAnalisis } from '@/types'

interface DonutChartProps {
  data: GrupoAnalisis[]
  title: string
}

export function DonutChart({ data, title }: DonutChartProps) {
  return (
    <div className="card p-4">
      <p className="section-label">{title}</p>
      <div className="flex gap-4 items-center">
        {/* Donut */}
        <div className="w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="valor"
                nameKey="nombre"
                innerRadius={36}
                outerRadius={56}
                strokeWidth={1}
                stroke="#ece7e1"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #ece7e1',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                }}
                labelStyle={{ color: '#221e1a', fontSize: 12 }}
                itemStyle={{ color: '#a09080', fontSize: 11 }}
                formatter={(v) => [typeof v === 'number' ? `€${v.toFixed(2)}` : String(v), '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda */}
        <div className="flex-1 space-y-1.5">
          {data.map((item, i) => (
            <div key={item.nombre} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="flex-1 truncate" style={{ color: 'var(--color-ink-2)' }}>
                {item.nombre}
              </span>
              <span className="font-medium" style={{ color: 'var(--color-muted)' }}>
                {item.peso_pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
