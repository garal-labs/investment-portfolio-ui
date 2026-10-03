'use client'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { CarteraSelector } from '@/components/layout/CarteraSelector'
import { Loading, EmptyState } from '@/components/ui/Loading'
import { CompositionCard } from '@/components/dashboard/CompositionCard'
import { PositionsTable } from '@/components/ui/PositionsTable'
import { ValueBlock, isPeriodoDegradado, type PeriodoSeleccionado } from '@/components/dashboard/ValueBlock'
import { useResumen, useRentabilidad } from '@/hooks/useCartera'
import { useActiveCartera } from '@/contexts/CarteraContext'
import {
  applyPeriodoRentabilidad,
  buildPositionViewModels,
  resolveActiveGroupKey,
  resolveActiveIsins,
  type Grupo,
  type HoverTarget,
} from '@/lib/portfolio-calc'

// Below 768px the treemap drops to a shorter height so the positions table
// still fits comfortably on small screens (design handoff's mobile spec).
const TREEMAP_HEIGHT_MOBILE = 240
const TREEMAP_HEIGHT_DESKTOP = 340
const MOBILE_QUERY = '(max-width: 767px)'

// Pure media-query switch used only for the Treemap's height prop — every
// other responsive rule (period control position, table columns) is CSS-only
// via Tailwind breakpoints on the child components.
function useTreemapHeight(): number {
  const [height, setHeight] = useState(TREEMAP_HEIGHT_DESKTOP)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const update = () => setHeight(mq.matches ? TREEMAP_HEIGHT_MOBILE : TREEMAP_HEIGHT_DESKTOP)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return height
}

export default function DashboardPage() {
  const { carteraId, isLoading: carteraLoading } = useActiveCartera()
  const [periodo, setPeriodo] = useState<PeriodoSeleccionado>('total')
  const esTotal = periodo === 'total'
  const { data: resumen, isLoading, isError } = useResumen(carteraId)
  const { data: rentabilidad } = useRentabilidad(carteraId, esTotal ? null : periodo)

  const [grupo, setGrupo] = useState<Grupo>('posicion')
  const [hover, setHover] = useState<HoverTarget>({})
  const treemapHeight = useTreemapHeight()

  function handleGrupoChange(next: Grupo) {
    setGrupo(next)
    setHover({})
  }

  const positions = useMemo(() => {
    if (!resumen) return []
    const base = buildPositionViewModels(resumen.posiciones, resumen.valor_total)
    return applyPeriodoRentabilidad(base, esTotal ? undefined : rentabilidad)
  }, [resumen, rentabilidad, esTotal])

  // Only the currently-selected non-total period is ever fetched (see
  // hooks/useCartera.ts), so this can only flag that one period as degraded
  // — the other tabs stay enabled until the user actually selects them.
  const unavailablePeriods = useMemo<PeriodoSeleccionado[]>(() => {
    if (esTotal || !rentabilidad || !isPeriodoDegradado(rentabilidad)) return []
    return [periodo]
  }, [esTotal, periodo, rentabilidad])

  const activeGroupKey = resolveActiveGroupKey(hover, positions, grupo)
  const activeIsins = resolveActiveIsins(hover, positions, grupo)

  return (
    <AppShell>
      <Topbar
        title={<CarteraSelector fallbackTitle="Mi cartera principal" />}
        subtitle={resumen ? `${resumen.num_posiciones} posiciones activas` : undefined}
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {carteraLoading && <Loading text="Cargando carteras..." />}
        {!carteraLoading && carteraId === null && (
          <EmptyState text="No tenés carteras todavía. La gestión de carteras llega próximamente en Ajustes." />
        )}
        {carteraId !== null && isLoading && <Loading text="Cargando posiciones y precios..." />}

        {resumen && (
          <>
            <ValueBlock
              resumen={resumen}
              periodo={periodo}
              onPeriodoChange={setPeriodo}
              rentabilidad={esTotal ? undefined : rentabilidad}
              unavailablePeriods={unavailablePeriods}
            />

            <CompositionCard
              positions={positions}
              activeKey={activeGroupKey}
              onHover={key => setHover(key == null ? {} : { groupKey: key })}
              onGrupoChange={handleGrupoChange}
              treemapHeight={treemapHeight}
            />

            <PositionsTable
              positions={positions}
              activeIsins={activeIsins}
              onHoverIsin={isin => setHover(isin == null ? {} : { isin })}
            />
          </>
        )}

        {carteraId !== null && isError && (
          <EmptyState text="Error al conectar con el servidor. Verificá que el backend esté activo." />
        )}
        {carteraId !== null && !isLoading && !isError && !resumen && (
          <EmptyState text="No se pudo cargar la cartera. ¿Está el backend activo?" />
        )}
      </div>
    </AppShell>
  )
}
