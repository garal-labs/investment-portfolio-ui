import type { Movimiento } from '@/types'

// Pure client-side filter powering Movimientos' `?isin=` deep link (see
// `app/movimientos/page.tsx`). No new hook/endpoint — `movimientos.listar`
// already returns the full list, this just narrows it for display. Kept as
// a pure function so it's testable without rendering the page or mocking
// next/navigation, react-query, or the auth/cartera contexts.
export function filterMovimientosPorIsin(
  movimientos: Movimiento[],
  isin: string | null,
): Movimiento[] {
  if (!isin) return movimientos
  return movimientos.filter(m => m.instrumento.isin === isin)
}
