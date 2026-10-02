'use client'
import Link from 'next/link'
import { usePreferences } from '@/lib/preferences'
import { formatCurrency, formatEur, formatPct, maskAmount, signRent } from '@/lib/utils'
import type { PositionViewModel } from '@/lib/portfolio-calc'

// Reference implementation formats quantity with a comma decimal, 1 decimal
// place only when fractional (fund participations), plain integer otherwise
// (e.g. "210,5 part." vs "14 títulos").
export function formatCantidadPosicion(cantidad: number, tipo: string): string {
  const txt = Number.isInteger(cantidad) ? String(cantidad) : cantidad.toFixed(1).replace('.', ',')
  const unidad = tipo.toLowerCase() === 'fondo' ? 'part.' : 'títulos'
  return `${txt} ${unidad}`
}

const GRID_COLS = 'minmax(150px,1fr) minmax(100px,140px) minmax(100px,150px) minmax(100px,140px) 14px'

export interface PositionRowProps {
  position: PositionViewModel
  color: string
  open: boolean
  onToggle: () => void
  onHover: () => void
  active: boolean
}

export function PositionRow({ position: p, color, open, onToggle, onHover, active }: PositionRowProps) {
  const { privacy, density } = usePreferences()
  const esDivisaExtranjera = p.moneda !== 'EUR'
  const vPad = density === 'compact' ? 10 : 16
  const rentColor = p.rentabilidadPct >= 0 ? '#2D6A5A' : '#8a3a6a'

  function monto(value: number) {
    return privacy ? maskAmount('EUR') : formatEur(value)
  }
  function beneficio(value: number) {
    return privacy ? maskAmount('EUR') : `${signRent(value)}${formatEur(value)}`
  }

  return (
    <div
      style={{
        borderBottom: '1px solid #f5f0eb',
        background: open ? '#fdfbf8' : '#fff',
        opacity: active ? 1 : 0.45,
        transition: 'opacity .15s, background .15s',
      }}
    >
      <button
        type="button"
        onMouseEnter={onHover}
        onClick={onToggle}
        aria-expanded={open}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'grid',
          gridTemplateColumns: GRID_COLS,
          gap: 16,
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box',
          paddingTop: vPad,
          paddingBottom: vPad,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ width: 8, height: 32, borderRadius: 3, flexShrink: 0, background: color }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.nombre}
            </span>
            <span style={{ fontSize: 12, color: '#a09080' }}>{p.ticker} · {p.tipo}</span>
          </span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {esDivisaExtranjera && p.precioActualNativo != null ? formatCurrency(p.precioActualNativo, p.moneda) : formatEur(p.precioActualEur)}
          </span>
          <span style={{ fontSize: 12, color: '#a09080' }}>{formatCantidadPosicion(p.cantidad, p.tipo)}</span>
        </span>
        <span style={{ fontSize: 14, fontWeight: 500, textAlign: 'right' }}>{monto(p.valorEur)}</span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: rentColor }}>{formatPct(p.rentabilidadPct)}</span>
          <span style={{ fontSize: 12, color: rentColor, opacity: 0.8 }}>{beneficio(p.plusvalia)}</span>
        </span>
        <span style={{ fontSize: 11, color: '#a09080', textAlign: 'right' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '4px 24px 22px 44px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '16px 24px',
              padding: '16px 20px',
              background: '#faf7f3',
              borderRadius: 10,
            }}
          >
            <Detalle etiqueta={p.tipo.toLowerCase() === 'fondo' ? 'Participaciones' : 'Títulos'} valor={String(p.cantidad).replace('.', ',')} />
            <Detalle etiqueta="Precio medio" valor={formatEur(p.precioMedio)} />
            <Detalle
              etiqueta="Precio actual"
              valor={formatEur(p.precioActualEur)}
              sub={esDivisaExtranjera && p.precioActualNativo != null ? formatCurrency(p.precioActualNativo, p.moneda) : undefined}
            />
            <Detalle etiqueta="Coste total" valor={monto(p.costeTotal)} />
            <Detalle etiqueta="Sector" valor={p.sector} />
            <Detalle etiqueta="País" valor={p.pais} />
            <Detalle etiqueta="Moneda" valor={p.moneda} />
            <Detalle etiqueta="ISIN" valor={p.isin} />
          </div>
          <Link href={`/movimientos?isin=${p.isin}`} style={{ fontSize: 13, fontWeight: 500 }}>
            Ver movimientos de {p.ticker} →
          </Link>
        </div>
      )}
    </div>
  )
}

function Detalle({ etiqueta, valor, sub }: { etiqueta: string; valor: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <p style={{ fontSize: 11, color: '#a09080' }}>{etiqueta}</p>
      <p style={{ fontSize: 14, fontWeight: 500 }}>{valor}</p>
      {sub && <p style={{ fontSize: 11, color: '#a09080' }}>{sub}</p>}
    </div>
  )
}
