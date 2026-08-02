'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { CarteraSelector } from '@/components/layout/CarteraSelector'
import { KpiCard } from '@/components/ui/KpiCard'
import { Loading, EmptyState } from '@/components/ui/Loading'
import { BarrasPeso } from '@/components/charts/BarrasPeso'
import { useResumen, useAnalisis } from '@/hooks/useCartera'
import { useActiveCartera } from '@/contexts/CarteraContext'
import { formatEur, formatCurrency, formatPct, signRent } from '@/lib/utils'

function TipoBadge({ tipo }: { tipo?: string }) {
  const t = (tipo ?? 'otro').toLowerCase()
  if (t === 'accion' || t === 'acción') return <span className="badge-accion">Acción</span>
  if (t === 'etf')                       return <span className="badge-etf">ETF</span>
  if (t === 'fondo')                     return <span className="badge-fondo">Fondo</span>
  return <span className="badge-otro">{tipo ?? 'Otro'}</span>
}

export default function DashboardPage() {
  const { carteraId, carteras, isLoading: carteraLoading } = useActiveCartera()
  const activeCartera = carteras.find(c => c.id === carteraId)
  const { data: resumen, isLoading, isError } = useResumen(carteraId)
  const { data: analisis } = useAnalisis(carteraId)

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
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-2.5">
              <KpiCard
                label="Valor cartera"
                value={formatEur(resumen.valor_total)}
                sub={`${resumen.num_posiciones} posiciones`}
              />
              <KpiCard
                label="Invertido"
                value={formatEur(resumen.coste_total)}
                sub="coste total"
              />
              <KpiCard
                label="Plusvalía latente"
                value={`${signRent(resumen.plusvalia_latente)}${formatEur(resumen.plusvalia_latente)}`}
                sub="no realizada"
                color={resumen.plusvalia_latente >= 0 ? 'positive' : 'negative'}
              />
              <KpiCard
                label="Rentabilidad"
                value={formatPct(resumen.rentabilidad_pct)}
                sub="total FIFO"
                color={resumen.rentabilidad_pct >= 0 ? 'positive' : 'negative'}
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
