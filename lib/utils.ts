// ── Formateo de números ───────────────────────────────────────────────────────

// Intl.NumberFormat('es-ES', ...) renders negative numbers with an ASCII
// hyphen-minus (U+002D) in this runtime's ICU data, but the design spec
// requires the true minus sign U+2212. Swap it after formatting rather than
// relying on locale data that may vary across environments.
function withUnicodeMinus(formatted: string): string {
  // Decide the sign after rounding: a value that rounds to zero (e.g. -0.001
  // at 2 decimals) must not render as "−0,00".
  if (!/[1-9]/.test(formatted)) return formatted.replace('-', '')
  return formatted.replace('-', '−')
}

export function formatEur(value?: number | null, decimals = 2): string {
  if (value == null) return '—'
  return withUnicodeMinus(
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: 'always',
    }).format(value),
  )
}

export function formatCurrency(value?: number | null, currency = 'EUR', decimals = 2): string {
  if (value == null) return '—'
  return withUnicodeMinus(
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: 'always',
    }).format(value),
  )
}

export function formatPct(value?: number | null): string {
  if (value == null) return '—'
  const magnitude = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))
  // Sign follows the rounded magnitude: zero keeps the "+" convention.
  const sign = value < 0 && /[1-9]/.test(magnitude) ? '−' : '+'
  return `${sign}${magnitude} %`
}

// Weight/peso is always a non-negative 0-1 fraction (e.g. share of portfolio
// value); rendered as a 1-decimal es-ES percentage, no sign.
export function formatPeso(value?: number | null): string {
  if (value == null) return '—'
  const pct = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value * 100)
  return `${pct} %`
}

// Privacy mode placeholder: never derived from the real amount (always
// formats 0), so it cannot leak magnitude or sign. Extracts just the
// currency symbol/suffix by stripping digits/separators from the 0-amount
// formatted string, keeping symbol placement (e.g. "US$" after the number)
// consistent with formatCurrency.
export function maskAmount(currency = 'EUR'): string {
  const symbol = formatCurrency(0, currency, 0).replace(/[\d.,\s]/g, '')
  return `••••• ${symbol}`
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

// ── Paleta del treemap de composición (orden por peso descendente) ───────────
// bg/text pairs per the design handoff README — 9 entries, wraps around from
// the 10th group onward.
export const TREEMAP_COLORS: { bg: string; text: string }[] = [
  { bg: '#2D6A5A', text: '#fff' },
  { bg: '#c4956a', text: '#221e1a' },
  { bg: '#8a3a6a', text: '#fff' },
  { bg: '#4a7a5a', text: '#fff' },
  { bg: '#e8c890', text: '#221e1a' },
  { bg: '#6a5a4a', text: '#fff' },
  { bg: '#5aaa8a', text: '#10231d' },
  { bg: '#c47aab', text: '#221e1a' },
  { bg: '#a09080', text: '#221e1a' },
]

export function treemapColor(index: number): { bg: string; text: string } {
  return TREEMAP_COLORS[index % TREEMAP_COLORS.length]
}

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

// ── Errores de API ──────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown, fallback: string): string {
  const detail =
    error != null &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
  return detail || fallback
}
