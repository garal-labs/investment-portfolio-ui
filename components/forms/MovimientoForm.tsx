'use client'
import { useEffect, useState } from 'react'
import { useCrearMovimiento, useAutodescubrir } from '@/hooks/useCartera'
import { hoy } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

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
  const [error, setError]           = useState('')

  const [nombreEmpresa, setNombreEmpresa]     = useState('')
  const [ticker, setTicker]                   = useState('')
  const [sector, setSector]                   = useState('')
  const [moneda, setMoneda]                   = useState('')
  const [tipoInstrumento, setTipoInstrumento] = useState('')

  const isinCompleto = isin.length === 12
  const { data: instrumento, isFetching: buscando } = useAutodescubrir(isinCompleto ? isin : '')
  const { mutateAsync: crearMovimiento, isPending }  = useCrearMovimiento()

  useEffect(() => {
    if (!isinCompleto) {
      setNombreEmpresa(''); setTicker(''); setSector(''); setMoneda(''); setTipoInstrumento('')
      return
    }
    setNombreEmpresa(instrumento?.nombre ?? '')
    setTicker(instrumento?.ticker ?? '')
    setSector(instrumento?.sector ?? '')
    setMoneda(instrumento?.moneda ?? '')
    setTipoInstrumento(instrumento?.tipo ?? '')
  }, [instrumento, isinCompleto])

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
      setTipoCambio(''); setNotas('')
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
      {/* ISIN */}
      <div>
        <label className="section-label flex items-center gap-1.5">
          ISIN
          {buscando && <Loader2 size={12} className="animate-spin" style={{ color: 'var(--color-primary)' }} />}
        </label>
        <input
          className="input-dark"
          placeholder="ES0148396007"
          value={isin}
          onChange={e => setIsin(e.target.value.toUpperCase())}
          maxLength={12}
        />
      </div>

      {/* Datos del instrumento (autocompletados a partir del ISIN, solo lectura) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="section-label">Nombre de la empresa</label>
          <input className="input-dark input-autofill" placeholder="—" value={nombreEmpresa} readOnly disabled />
        </div>
        <div>
          <label className="section-label">Ticker</label>
          <input className="input-dark input-autofill" placeholder="—" value={ticker} readOnly disabled />
        </div>
        <div>
          <label className="section-label">Sector</label>
          <input className="input-dark input-autofill" placeholder="—" value={sector} readOnly disabled />
        </div>
        <div>
          <label className="section-label">Moneda</label>
          <input className="input-dark input-autofill" placeholder="—" value={moneda} readOnly disabled />
        </div>
        <div className="col-span-2">
          <label className="section-label">Tipo de instrumento</label>
          <input className="input-dark input-autofill" placeholder="—" value={tipoInstrumento} readOnly disabled />
        </div>
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
