'use client'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Topbar } from '@/components/layout/Topbar'
import { MovimientoForm } from '@/components/forms/MovimientoForm'
import { Loading, EmptyState } from '@/components/ui/Loading'
import { useMovimientos, useEliminarMovimiento } from '@/hooks/useCartera'
import { useActiveCartera } from '@/contexts/CarteraContext'
import { formatEur, formatFecha } from '@/lib/utils'
import { Trash2, Plus, X } from 'lucide-react'

export default function MovimientosPage() {
  const [showForm, setShowForm] = useState(false)
  const { carteraId, isLoading: carteraLoading } = useActiveCartera()
  const { data: movs, isLoading, isError } = useMovimientos(carteraId)
  const { mutate: eliminar } = useEliminarMovimiento(carteraId)

  return (
    <AppShell>
      <Topbar title="Movimientos" subtitle="Historial de operaciones" />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {carteraLoading && <Loading text="Cargando carteras..." />}
        {!carteraLoading && carteraId === null && (
          <EmptyState text="No tenés carteras todavía. La gestión de carteras llega próximamente en Ajustes." />
        )}

        {carteraId !== null && (
        <>
        {/* Botón añadir */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(v => !v)}
            className={showForm ? 'btn-ghost flex items-center gap-2' : 'btn-primary flex items-center gap-2'}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancelar' : 'Nuevo movimiento'}
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="card p-5">
            <p className="section-label mb-4">Añadir movimiento</p>
            <MovimientoForm
              carteraId={carteraId}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Tabla */}
        {isLoading && <Loading text="Cargando movimientos..." />}

        {movs && movs.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Instrumento', 'Tipo', 'Fecha', 'Cantidad', 'Precio', 'Comisión', ''].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        color: 'var(--color-muted)',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movs.map(mov => (
                  <tr
                    key={mov.id}
                    style={{ borderBottom: '1px solid var(--color-border-2)' }}
                    className="transition-colors hover:bg-[#faf8f5]"
                  >
                    {/* Instrumento */}
                    <td className="px-3.5 py-[9px]">
                      <p className="font-medium truncate max-w-[160px]" style={{ color: 'var(--color-ink)' }}>
                        {mov.instrumento.nombre || mov.instrumento.isin}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>
                        {mov.instrumento.isin}
                      </p>
                    </td>

                    {/* Tipo compra/venta */}
                    <td className="px-2 py-[9px]">
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded"
                        style={
                          mov.tipo === 'compra'
                            ? { background: 'var(--badge-accion-bg)', color: 'var(--badge-accion-fg)' }
                            : { background: '#fdeef5', color: 'var(--color-plum)' }
                        }
                      >
                        {mov.tipo}
                      </span>
                    </td>

                    <td className="px-3.5 py-[9px]" style={{ color: 'var(--color-ink-2)' }}>
                      {formatFecha(mov.fecha)}
                    </td>
                    <td className="px-3.5 py-[9px]" style={{ color: 'var(--color-ink-2)' }}>
                      {mov.cantidad}
                    </td>
                    <td className="px-3.5 py-[9px]" style={{ color: 'var(--color-ink-2)' }}>
                      {formatEur(mov.precio)}
                    </td>
                    <td className="px-3.5 py-[9px]" style={{ color: 'var(--color-muted)' }}>
                      {mov.comision > 0 ? formatEur(mov.comision) : '—'}
                    </td>

                    {/* Eliminar */}
                    <td className="px-3.5 py-[9px]">
                      <button
                        onClick={() => {
                          if (window.confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) {
                            eliminar(mov.id)
                          }
                        }}
                        className="p-1 transition-colors hover:text-[var(--color-plum)]"
                        style={{ color: 'var(--color-muted)' }}
                        title="Eliminar movimiento"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isError && (
          <EmptyState text="Error al cargar los movimientos. Verificá la conexión con el backend." />
        )}
        {!isLoading && !isError && movs?.length === 0 && (
          <EmptyState text="No hay movimientos aún. Añade tu primera operación." />
        )}
        </>
        )}
      </div>
    </AppShell>
  )
}
