'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CircleHelp, ExternalLink } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { Loading, EmptyState } from '@/components/ui/Loading'
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/SegmentedControl'
import { FronteraChart } from '@/components/charts/FronteraChart'
import { ExclusionesNotice } from '@/components/analisis/ExclusionesNotice'
import { DetalleCalculo } from '@/components/analisis/DetalleCalculo'
import { MovimientosTable } from '@/components/analisis/MovimientosTable'
import { useFronteraEficiente } from '@/hooks/useCartera'
import { useActiveCartera } from '@/contexts/CarteraContext'
import { formatFecha, getFronteraErrorMessage } from '@/lib/utils'
import { defaultFrontierIndex } from '@/lib/rebalanceo'
import type { FronteraEficiente } from '@/types'

type Horizonte = '3' | '5' | '10'

const HORIZONTE_OPTIONS: SegmentedControlOption<Horizonte>[] = [
  { value: '3', label: '3 años' },
  { value: '5', label: '5 años' },
  { value: '10', label: '10 años' },
]

const cardStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 14,
  padding: 24,
}

export default function AnalisisPage() {
  const { carteraId, isLoading: carteraLoading } = useActiveCartera()
  const [horizonte, setHorizonte] = useState<Horizonte>('5')
  const { data: frontera, isLoading, isError, error } = useFronteraEficiente(carteraId, Number(horizonte))

  // The chosen frontier point belongs to the response it was picked on: a new
  // response (another horizon, a refetch after a movement) falls back to the
  // default point, the one closest in volatility to the current portfolio.
  const [seleccion, setSeleccion] = useState<{ frontera: FronteraEficiente; index: number } | null>(null)
  const selectedIndex = frontera
    ? seleccion?.frontera === frontera
      ? seleccion.index
      : defaultFrontierIndex(frontera.frontera, frontera.cartera_actual)
    : null
  const objetivo = frontera && selectedIndex != null ? frontera.frontera[selectedIndex] : undefined
  const handleSelect = (index: number) => {
    if (frontera) setSeleccion({ frontera, index })
  }

  return (
    <AppShell>
      <Topbar title="Markowitz" subtitle="Frontera eficiente" />

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {carteraLoading && <Loading text="Cargando carteras..." />}
        {!carteraLoading && carteraId === null && (
          <EmptyState text="No tenés carteras todavía. La gestión de carteras llega próximamente en Ajustes." />
        )}

        {carteraId !== null && (
          // Stays visible on loading/error so another horizon can be tried
          // (e.g. after a 400 for not enough history).
          <section
            aria-labelledby="frontera-title"
            className="flex flex-wrap items-center justify-between gap-4"
            style={cardStyle}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <h2 id="frontera-title" className="font-serif" style={{ fontSize: 20, fontWeight: 700 }}>
                Frontera eficiente
              </h2>
              {frontera && (
                <>
                  <p style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>
                    {formatFecha(frontera.fecha_inicio)} – {formatFecha(frontera.fecha_fin)} ·{' '}
                    {frontera.n_observaciones} observaciones mensuales
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                    Todas las cifras son mensuales, no anualizadas.
                  </p>
                </>
              )}
              <Link
                href="/markowitz/metodologia"
                target="_blank"
                rel="noopener noreferrer"
                title="Se abre en una pestaña nueva"
                className="mt-1 inline-flex items-center gap-1 self-start underline-offset-2 hover:underline"
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}
              >
                <CircleHelp aria-hidden size={14} />
                ¿Cómo se calcula?
                <ExternalLink aria-hidden size={12} />
              </Link>
            </div>
            <SegmentedControl
              options={HORIZONTE_OPTIONS}
              value={horizonte}
              onChange={setHorizonte}
              aria-label="Horizonte histórico"
            />
          </section>
        )}

        {carteraId !== null && isLoading && <Loading text="Calculando frontera eficiente..." />}
        {carteraId !== null && isError && <EmptyState text={getFronteraErrorMessage(error)} />}

        {frontera && (
          <>
            <ExclusionesNotice excluidos={frontera.excluidos} pesoExcluido={frontera.peso_excluido} />

            <section aria-labelledby="riesgo-title" className="flex flex-col gap-4" style={cardStyle}>
              <div>
                <h2 id="riesgo-title" className="font-serif" style={{ fontSize: 20, fontWeight: 700 }}>
                  Riesgo y rentabilidad
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  Cada punto de la frontera es la cartera con menor volatilidad para su rentabilidad esperada.
                  Elige un punto en el gráfico o con el control de riesgo objetivo para ver cómo llegar a él.
                </p>
              </div>
              <FronteraChart
                frontera={frontera.frontera}
                minimaVarianza={frontera.cartera_minima_varianza}
                actual={frontera.cartera_actual}
                tickers={frontera.tickers}
                selectedIndex={selectedIndex}
                onSelect={handleSelect}
              />
            </section>

            {objetivo && (
              <MovimientosTable
                tickers={frontera.tickers}
                actual={frontera.cartera_actual}
                objetivo={objetivo}
                valoresEur={frontera.detalle.cartera_actual.valores_eur}
                esMinimaVarianza={selectedIndex === 0}
              />
            )}

            <DetalleCalculo frontera={frontera} />
          </>
        )}
      </div>
    </AppShell>
  )
}
