'use client'
import { useState } from 'react'
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/SegmentedControl'
import { PositionRow } from '@/components/ui/PositionRow'
import { treemapColor } from '@/lib/utils'
import { groupPositions, type PositionViewModel } from '@/lib/portfolio-calc'

export type SortKey = 'peso' | 'rent' | 'nombre'

const SORT_OPTIONS: SegmentedControlOption<SortKey>[] = [
  { value: 'peso', label: 'Peso' },
  { value: 'rent', label: 'Rentabilidad' },
  { value: 'nombre', label: 'Nombre' },
]

const SORT_FNS: Record<SortKey, (a: PositionViewModel, b: PositionViewModel) => number> = {
  peso: (a, b) => b.peso - a.peso,
  rent: (a, b) => b.rentabilidadPct - a.rentabilidadPct,
  nombre: (a, b) => a.nombre.localeCompare(b.nombre),
}

export function sortPositions(vms: PositionViewModel[], sort: SortKey): PositionViewModel[] {
  return [...vms].sort(SORT_FNS[sort])
}

// Row color bar always reflects each position's own tile color in the
// Posición-grouped treemap, independent of the composition card's currently
// selected grouping — gives every position a stable identity color.
export function buildPositionColorMap(positions: PositionViewModel[]): Record<string, string> {
  const groups = groupPositions(positions, 'posicion')
  return Object.fromEntries(groups.map((g, i) => [g.key, treemapColor(i).bg]))
}

export interface PositionsTableProps {
  positions: PositionViewModel[]
  activeIsins?: Set<string> | null
  onHoverIsin?: (isin: string | null) => void
}

export function PositionsTable({ positions, activeIsins = null, onHoverIsin }: PositionsTableProps) {
  const [sort, setSort] = useState<SortKey>('peso')
  const [open, setOpen] = useState<string | null>(null)
  const sorted = sortPositions(positions, sort)
  const colorMap = buildPositionColorMap(positions)

  return (
    <section style={{ background: '#fff', border: '1px solid #ece7e1', borderRadius: 14, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '22px 24px 14px', flexWrap: 'wrap' }}>
        <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 700 }}>Posiciones</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#a09080' }}>Ordenar por</span>
          <SegmentedControl options={SORT_OPTIONS} value={sort} onChange={setSort} aria-label="Ordenar por" />
        </div>
      </div>

      <div
        className="hidden md:grid"
        style={{
          gridTemplateColumns: 'minmax(150px,1fr) minmax(100px,140px) minmax(100px,150px) minmax(100px,140px) 14px',
          gap: 16,
          padding: '10px 24px',
          borderTop: '1px solid #ece7e1',
          borderBottom: '1px solid #ece7e1',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: '#a09080',
        }}
      >
        <span>Instrumento</span>
        <span style={{ textAlign: 'right' }}>Precio · Cantidad</span>
        <span style={{ textAlign: 'right' }}>Valor</span>
        <span style={{ textAlign: 'right' }}>Rentabilidad</span>
        <span />
      </div>

      <div onMouseLeave={() => onHoverIsin?.(null)} style={{ display: 'flex', flexDirection: 'column' }}>
        {sorted.map(p => (
          <PositionRow
            key={p.isin}
            position={p}
            color={colorMap[p.isin] ?? '#a09080'}
            open={open === p.isin}
            onToggle={() => setOpen(prev => (prev === p.isin ? null : p.isin))}
            onHover={() => onHoverIsin?.(p.isin)}
            active={activeIsins == null || activeIsins.has(p.isin)}
          />
        ))}
        {sorted.length === 0 && (
          <p className="font-lora italic" style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: '#a09080' }}>
            No hay posiciones aún. Añade tu primer movimiento.
          </p>
        )}
      </div>
    </section>
  )
}
