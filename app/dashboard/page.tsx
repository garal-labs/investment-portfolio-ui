'use client'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { CarteraSelector } from '@/components/layout/CarteraSelector'
import { KpiCard } from '@/components/ui/KpiCard'
import { Loading, EmptyState } from '@/components/ui/Loading'
import { PeriodoSelector, type PeriodoSeleccionado } from '@/components/ui/PeriodoSelector'
import { BarrasPeso } from '@/components/charts/BarrasPeso'
import { useResumen, useAnalisis, useRentabilidad } from '@/hooks/useCartera'
import { useActiveCartera } from '@/contexts/CarteraContext'
import { formatEur, formatCurrency, formatPct, signRent } from '@/lib/utils'

function TipoBadge({ tipo }: { tipo?: string }) {
  const t = (tipo ?? 'otro').toLowerCase()
  if (t === 'accion' || t === 'acción') return <span className="badge-accion">Acción</span>
  if (t === 'etf')                       return <span className="badge-etf">ETF</span>
  if (t === 'fondo')                     return <span className="badge-fondo">Fondo</span>
  return <span className="badge-otro">{tipo ?? 'Otro'}</span>
}

const PERIODO_SUB: Record<PeriodoSeleccionado, string> = {
  total: 'total FIFO',
  '1m': 'último mes',
  '2m': 'últimos 2 meses',
  '3m': 'últimos 3 meses',
  '6m': 'últimos 6 meses',
  ytd: 'en lo que va de año',
  '1y': 'último año',
  '2y': 'últimos 2 años',
  '3y': 'últimos 3 años',
}

export default function DashboardPage() {
  const { carteraId, carteras, isLoading: carteraLoading } = useActiveCartera()
  const activeCartera = carteras.find(c => c.id === carteraId)
  const [periodo, setPeriodo] = useState<PeriodoSeleccionado>('total')
  const esTotal = periodo === 'total'
  const { data: resumen, isLoading, isError } = useResumen(carteraId)
  const { data: analisis } = useAnalisis(carteraId)
  const { data: rentabilidad, isLoading: isLoadingRentabilidad } = useRentabilidad(
    carteraId,
    esTotal ? null : periodo,
  )

  // KPIs: "Total" usa el resumen histórico; cualquier otro periodo usa /rentabilidad.
  const kpiValorTotal = esTotal ? resumen?.valor_total : rentabilidad?.valor_total
  const kpiCosteTotal = esTotal ? resumen?.coste_total : rentabilidad?.coste_total
  const kpiPlusvalia = esTotal ? resumen?.plusvalia_latente : rentabilidad?.plusvalia_total
  const kpiRentabilidadPct = esTotal ? resumen?.rentabilidad_pct : rentabilidad?.rentabilidad_pct
  const kpisCargando = esTotal ? isLoading : isLoadingRentabilidad

  return (
    <AppShell>
      <Topbar
        title={<CarteraSelector fallbackTitle="Mi cartera principal" />}
        subtitle={resumen ? `${resumen.num_posiciones} posiciones activas` : undefined}
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {carteraLoading && <Loading text="Cargando carteras..." />}
        {!carteraLoading && carteraId === null && (
          <EmptyState text="No tenés carteras todavía. La gestión de carteras llega próximamente en Ajustes." />
        )}
        {carteraId !== null && isLoading && <Loading text="Cargando posiciones y precios..." />}

        {resumen && (
          <>
            <PeriodoSelector value={periodo} onChange={setPeriodo} />

            {/* KPIs — reflejan el periodo elegido arriba */}
            <div className="grid grid-cols-4 gap-2.5" style={{ opacity: kpisCargando ? 0.5 : 1 }}>
              <KpiCard
                label="Valor cartera"
                value={formatEur(kpiValorTotal)}
                sub={esTotal ? `${resumen.num_posiciones} posiciones` : PERIODO_SUB[periodo]}
              />
              <KpiCard
                label="Invertido"
                value={formatEur(kpiCosteTotal)}
                sub={esTotal ? 'coste total' : 'coste base del periodo'}
              />
              <KpiCard
                label={esTotal ? 'Plusvalía latente' : 'Plusvalía del periodo'}
                value={kpiPlusvalia != null ? `${signRent(kpiPlusvalia)}${formatEur(kpiPlusvalia)}` : '—'}
                sub={esTotal ? 'no realizada' : 'latente + realizada'}
                color={kpiPlusvalia == null ? 'default' : kpiPlusvalia >= 0 ? 'positive' : 'negative'}
              />
              <KpiCard
                label="Rentabilidad"
                value={formatPct(kpiRentabilidadPct)}
                sub={PERIODO_SUB[periodo]}
                color={kpiRentabilidadPct == null ? 'default' : kpiRentabilidadPct >= 0 ? 'positive' : 'negative'}
              />
            </div>

            {/* Tabla posiciones */}
            <div className="card overflow-hidden">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                     {['Instrumento', 'Tipo', 'Sector', 'P. medio', 'P. actual', 'Acciones', 'Valor', 'Beneficio', 'Peso', 'Rent.'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 14px',
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.10em',
                          textTransform: 'uppercase',
                          color: 'var(--color-muted)',
                          textAlign: ['P. medio', 'P. actual', 'Acciones', 'Valor', 'Beneficio', 'Peso', 'Rent.'].includes(h) ? 'right' : 'left',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resumen.posiciones.map(pos => {
                    const rent = pos.rentabilidad_pct
                    const rentColor =
                      rent == null ? 'var(--color-muted)'
                      : rent > 0   ? 'var(--color-primary)'
                      : rent < 0   ? 'var(--color-plum)'
                      : 'var(--color-amber)'

                    const beneficio = pos.plusvalia_latente
                    const beneficioColor =
                      beneficio == null ? 'var(--color-muted)'
                      : beneficio > 0   ? 'var(--color-primary)'
                      : beneficio < 0   ? 'var(--color-plum)'
                      : 'var(--color-amber)'

                    const esDivisaExtranjera = !!pos.moneda_nativa && pos.moneda_nativa !== 'EUR'
                    const precioEur = pos.precio_actual_eur ?? pos.precio_actual
                    const valorEur = pos.valor_actual_eur ?? pos.valor_actual ?? pos.coste_total
                    const valorPos = valorEur
                    const peso = resumen.valor_total > 0
                      ? (valorPos / resumen.valor_total) * 100
                      : null

                    return (
                      <tr
                        key={pos.instrumento.isin}
                        style={{ borderBottom: '1px solid var(--color-border-2)' }}
                      >
                        {/* Instrumento */}
                        <td className="px-3.5 py-[9px]">
                          <div className="font-medium" style={{ color: 'var(--color-ink)' }}>
                            {pos.instrumento.nombre || pos.instrumento.isin}
                          </div>
                          <div
                            className="text-[10px] font-mono"
                            style={{ color: 'var(--color-muted)' }}
                          >
                            {pos.instrumento.isin}
                          </div>
                        </td>

                        {/* Tipo */}
                        <td className="px-2 py-[9px]">
                          <TipoBadge tipo={pos.instrumento.tipo} />
                        </td>

                        {/* Sector */}
                        <td className="px-2 py-[9px]">
                          {pos.instrumento.sector && (
                            <span className="badge-sector">{pos.instrumento.sector}</span>
                          )}
                        </td>

                        {/* Precio medio */}
                         <td className="px-3.5 py-[9px] text-right" style={{ color: 'var(--color-ink-2)' }}>
                           {formatEur(pos.precio_medio)}
                         </td>

                         {/* Precio actual */}
                         <td className="px-3.5 py-[9px] text-right" style={{ color: 'var(--color-ink-2)' }}>
                           {precioEur != null ? formatEur(precioEur) : '—'}
                           {esDivisaExtranjera && pos.precio_actual_nativo != null && (
                             <div className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>
                               {formatCurrency(pos.precio_actual_nativo, pos.moneda_nativa)}
                             </div>
                           )}
                         </td>

                         {/* Acciones */}
                         <td className="px-3.5 py-[9px] text-right" style={{ color: 'var(--color-ink-2)' }}>
                           {pos.cantidad_actual}
                         </td>

                         {/* Valor */}
                         <td className="px-3.5 py-[9px] text-right" style={{ color: 'var(--color-ink-2)' }}>
                           {formatEur(valorEur)}
                           {esDivisaExtranjera && pos.valor_actual_nativo != null && (
                             <div className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>
                               {formatCurrency(pos.valor_actual_nativo, pos.moneda_nativa)}
                             </div>
                           )}
                         </td>

                         {/* Beneficio */}
                         <td className="px-3.5 py-[9px] text-right font-medium" style={{ color: beneficioColor }}>
                           {beneficio != null ? `${signRent(beneficio)}${formatEur(beneficio)}` : '—'}
                         </td>

                         {/* Peso en cartera */}
                         <td className="px-3.5 py-[9px] text-right" style={{ color: 'var(--color-ink-2)' }}>
                           {peso != null ? `${peso.toFixed(1)}%` : '—'}
                         </td>

                         {/* Rentabilidad */}
                         <td
                          className="px-3.5 py-[9px] text-right font-medium"
                          style={{ color: rentColor }}
                        >
                          {rent != null ? formatPct(rent) : '—'}
                        </td>
                      </tr>
                    )
                  })}

                  {resumen.posiciones.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-6 text-center font-lora italic text-sm" style={{ color: 'var(--color-muted)' }}>
                        No hay posiciones aún. Añade tu primer movimiento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Análisis rápido */}
            {analisis && (analisis.por_sector.length > 0 || analisis.por_pais.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {analisis.por_sector.length > 0 && (
                  <BarrasPeso data={analisis.por_sector} title="Por sector" />
                )}
                {analisis.por_pais.length > 0 && (
                  <BarrasPeso data={analisis.por_pais} title="Por país" />
                )}
              </div>
            )}
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
