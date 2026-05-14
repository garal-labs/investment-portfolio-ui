// ── Formateo de números ───────────────────────────────────────────────────────

export function formatEur(value?: number | null, decimals = 2): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPct(value?: number | null): string {
  if (value == null) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatNum(value?: number | null, decimals = 2): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// ── Colores semánticos (paleta Garal) ─────────────────────────────────────────

export function colorRent(value?: number | null): string {
  if (value == null) return 'text-taupe'
  if (value > 0) return 'text-primary'    // verde
  if (value < 0) return 'text-plum'       // ciruela
  return 'text-amber'                      // cero: amber
}

export function signRent(value?: number | null): string {
  if (value == null || value === 0) return ''
  return value > 0 ? '+' : ''
}

// ── Colores para gráficos (orden Garal) ───────────────────────────────────────

export const CHART_COLORS = [
  '#2D6A5A', // primary green
  '#c4956a', // amber
  '#8a3a6a', // plum
  '#4a7a5a', // moss
  '#6a5a4a', // umber
  '#a09080', // taupe
  '#5aaa8a', // green light
  '#e8c890', // amber light
  '#c47aab', // plum light
  '#7a6a5a', // umber mid
]

// ── Fechas ────────────────────────────────────────────────────────────────────

export function formatFecha(fecha: string): string {
  // Parseo manual para evitar que Date interprete "YYYY-MM-DD" como UTC medianoche
  // y lo muestre como el día anterior en zonas UTC+X
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function hoy(): string {
  return new Date().toISOString().split('T')[0]
}
