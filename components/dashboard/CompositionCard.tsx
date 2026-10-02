'use client'
import { useState } from 'react'
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/SegmentedControl'
import { Treemap } from '@/components/ui/Treemap'
import { formatPeso } from '@/lib/utils'
import { groupPositions, type CompositionGroup, type Grupo, type PositionViewModel } from '@/lib/portfolio-calc'

const GRUPO_OPTIONS: SegmentedControlOption<Grupo>[] = [
  { value: 'posicion', label: 'Posición' },
  { value: 'sector', label: 'Sector' },
  { value: 'pais', label: 'País' },
  { value: 'tipo', label: 'Tipo' },
]

// Pure — mirrors the reference implementation's `compSub` derivation
// (design_handoff_tu_cartera's trailing <script> block).
export function buildCompositionSubtitle(groups: CompositionGroup[], grupo: Grupo): string {
  if (grupo === 'posicion') {
    const top3 = groups.slice(0, 3).reduce((sum, g) => sum + g.peso, 0)
    return `Las 3 mayores posiciones suman el ${formatPeso(top3)}`
  }
  const mayor = groups[0]?.peso ?? 0
  return `${groups.length} grupos · el mayor pesa ${formatPeso(mayor)}`
}

interface CompositionCardProps {
  positions: PositionViewModel[]
  activeKey?: string | null
  onHover?: (key: string | null) => void
  // Grupo stays owned internally (see apply-progress deviation note), but is
  // reported upward so a parent can know which key-space `activeKey` and
  // hover events are in (needed for cross-highlighting with other panels).
  onGrupoChange?: (grupo: Grupo) => void
  treemapHeight?: number
}

export function CompositionCard({
  positions,
  activeKey = null,
  onHover,
  onGrupoChange,
  treemapHeight,
}: CompositionCardProps) {
  const [grupo, setGrupo] = useState<Grupo>('posicion')
  const groups = groupPositions(positions, grupo)
  const subtitle = buildCompositionSubtitle(groups, grupo)

  function handleGrupoChange(next: Grupo) {
    setGrupo(next)
    onGrupoChange?.(next)
  }

  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 700 }}>
            Composición
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>{subtitle}</p>
        </div>
        <SegmentedControl
          options={GRUPO_OPTIONS}
          value={grupo}
          onChange={handleGrupoChange}
          aria-label="Agrupar por"
        />
      </div>
      <Treemap groups={groups} activeKey={activeKey} onHover={onHover} height={treemapHeight} />
    </section>
  )
}
