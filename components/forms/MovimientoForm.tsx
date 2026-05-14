'use client'
import { useState } from 'react'
import { useCrearMovimiento, useAutodescubrir } from '@/hooks/useCartera'
import { hoy } from '@/lib/utils'
import { Loader2, Sparkles } from 'lucide-react'

interface MovimientoFormProps {
  carteraId: number
  onSuccess?: () => void
}

export function MovimientoForm({ carteraId, onSuccess }: MovimientoFormProps) {
  const [isin, setIsin]             = useState('')
  const [tipo, setTipo]             = useState<'compra' | 'venta'>('compra')
  const [fecha, setFecha]           = useState(hoy())
  const [cantidad, setCantidad]     = useState('')
  const [precio, setPrecio]         = useState('')
  const [comision, setComision]     = useState('')
  const [tipoCambio, setTipoCambio] = useState('')
  const [notas, setNotas]           = useState('')
  const [isinBuscado, setIsinBuscado] = useState('')
  const [error, setError]           = useState('')

  const { data: instrumento, isFetching: buscando } = useAutodescubrir(isinBuscado)
  const { mutateAsync: crearMovimiento, isPending }  = useCrearMovimiento()

  function handleAutodescubrir() {
    if (isin.length < 12) return
    setIsinBuscado(isin)
  }

  async function handleSubmit() {
    setError('')
    if (!isin || !cantidad || !precio) {
      setError('ISIN, cantidad y precio son obligatorios')
      return
    }
    try {
      await crearMovimiento({
        cartera_id: carteraId,
        isin: isin.toUpperCase(),
        tipo,
        fecha,
        cantidad: parseFloat(cantidad),
        precio: parseFloat(precio),
        comision: comision ? parseFloat(comision) : 0,
        tipo_cambio: tipoCambio ? parseFloat(tipoCambio) : undefined,
        notas: notas || undefined,
      })
      setIsin(''); setCantidad(''); setPrecio(''); setComision('')
      setTipoCambio(''); setNotas(''); setIsinBuscado('')
      onSuccess?.()
    } catch (e: unknown) {
      const detail =
        e != null &&
        typeof e === 'object' &&
        'response' in e &&
        (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(detail || 'Error al guardar el movimiento')
    }
  }

  return (
    <div className="space-y-4">
      {/* ISIN + Autodescubrir */}
      <div>
        <label className="section-label">ISIN</label>
        <div className="flex gap-2">
          <input
            className="input-dark flex-1"
            placeholder="ES0148396007"
            value={isin}
            onChange={e => setIsin(e.target.value.toUpperCase())}
            maxLength={12}
          />
          <button
            onClick={handleAutodescubrir}
            disabled={isin.length < 12 || buscando}
            className="btn-ghost flex items-center gap-1.5 px-3"
            title="Autodetectar con IA"
          >
            {buscando
              ? <Loader2 size={14} className="animate-spin" />
              : <Sparkles size={14} />
            }
            <span className="text-xs">IA</span>
          </button>
        </div>
        {instrumento && (
          <p className="text-xs mt-1.5 font-lora italic" style={{ color: 'var(--color-primary)' }}>
            ✓ {instrumento.nombre} · {instrumento.sector} · {instrumento.pais} · {instrumento.moneda}
          </p>
        )}
      </div>

      {/* Tipo */}
      <div>
        <label className="section-label">Tipo de operación</label>
        <div className="flex gap-2">
          {(['compra', 'venta'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors"
              style={
                tipo === t
                  ? t === 'compra'
                    ? { background: 'rgba(45,106,90,.12)', color: 'var(--color-primary)', border: '1px solid rgba(45,106,90,.3)' }
                    : { background: 'rgba(138,58,106,.1)',  color: 'var(--color-plum)',    border: '1px solid rgba(138,58,106,.3)' }
                  : { background: 'var(--color-bg)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Fecha, cantidad, precio */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="section-label">Fecha</label>
          <input type="date" className="input-dark" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>
        <div>
          <label className="section-label">Cantidad</label>
          <input type="number" className="input-dark" placeholder="10" value={cantidad} onChange={e => setCantidad(e.target.value)} min="0" step="any" />
        </div>
        <div>
          <label className="section-label">Precio</label>
          <input type="number" className="input-dark" placeholder="150.00" value={precio} onChange={e => setPrecio(e.target.value)} min="0" step="any" />
        </div>
      </div>

      {/* Opcionales */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="section-label">Comisión (opcional)</label>
          <input type="number" className="input-dark" placeholder="0.00" value={comision} onChange={e => setComision(e.target.value)} min="0" step="any" />
        </div>
        <div>
          <label className="section-label">Tipo cambio (opcional)</label>
          <input type="number" className="input-dark" placeholder="1.08 (USD/EUR)" value={tipoCambio} onChange={e => setTipoCambio(e.target.value)} min="0" step="any" />
        </div>
      </div>

      <div>
        <label className="section-label">Notas (opcional)</label>
        <input className="input-dark" placeholder="Ej: compra programada" value={notas} onChange={e => setNotas(e.target.value)} />
      </div>

      {error && (
        <p className="text-xs font-lora italic" style={{ color: 'var(--color-plum)' }}>
          {error}
        </p>
      )}

      <button onClick={handleSubmit} disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Guardando...' : 'Guardar movimiento'}
      </button>
    </div>
  )
}
