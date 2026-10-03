// Faithful TypeScript port of the squarify() treemap layout algorithm and
// tile content-visibility rules from the reference implementation in
// `design_handoff_tu_cartera/Tu Cartera rediseno.dc.html`'s trailing
// <script> block. Recursive worst-ratio row/column squarified partition.

export interface SquarifyItem {
  key: string
  v: number
}

export interface SquarifyRect extends SquarifyItem {
  x: number
  y: number
  w: number
  h: number
}

type Rect<T extends SquarifyItem> = T & { x: number; y: number; w: number; h: number }

export function squarify<T extends SquarifyItem>(
  items: T[],
  x: number,
  y: number,
  w: number,
  h: number,
  out: Rect<T>[] = [],
): Rect<T>[] {
  if (!items.length) return out
  if (items.length === 1) {
    out.push({ ...items[0], x, y, w, h })
    return out
  }

  const total = items.reduce((s, i) => s + i.v, 0)
  if (!(w > 0 && h > 0)) {
    // Degenerate container (e.g. earlier rows consumed all the space).
    items.forEach(i => out.push({ ...i, x, y, w: Math.max(w, 0), h: Math.max(h, 0) }))
    return out
  }
  if (!(total > 0)) {
    // Nothing to weigh by (all zero, or only zero-valued items remain):
    // split the space equally instead of dividing by zero.
    const equal = squarify(items.map(i => ({ ...i, v: 1 })), x, y, w, h)
    equal.forEach((r, idx) => out.push({ ...r, v: items[idx].v } as Rect<T>))
    return out
  }
  const scale = (w * h) / total
  const short = Math.min(w, h)

  const worst = (row: T[]): number => {
    const areas = row.map(i => i.v * scale)
    const sum = areas.reduce((a, b) => a + b, 0)
    return Math.max(
      (short * short * Math.max(...areas)) / (sum * sum),
      (sum * sum) / (short * short * Math.min(...areas)),
    )
  }

  let row: T[] = []
  const rest = items.slice()
  while (rest.length) {
    const next = [...row, rest[0]]
    if (!row.length || worst(next) <= worst(row)) {
      row = next
      rest.shift()
    } else break
  }

  const rowSize = row.reduce((a, i) => a + i.v, 0) * scale

  if (w >= h) {
    const rowWidth = rowSize / h
    let cy = y
    row.forEach(i => {
      const ih = (i.v * scale) / rowWidth
      out.push({ ...i, x, y: cy, w: rowWidth, h: ih })
      cy += ih
    })
    squarify(rest, x + rowWidth, y, w - rowWidth, h, out)
  } else {
    const rowHeight = rowSize / w
    let cx = x
    row.forEach(i => {
      const iw = (i.v * scale) / rowHeight
      out.push({ ...i, x: cx, y, w: iw, h: rowHeight })
      cx += iw
    })
    squarify(rest, x, y + rowHeight, w, h - rowHeight, out)
  }

  return out
}

export interface TileContent {
  showName: boolean
  showPct: boolean
  pctSize: '34px' | '22px' | '15px'
  pad: string
}

// Content-visibility rules by rendered tile pixel size (spec-corrected
// thresholds — see sdd/cartera-resumen-redesign/spec).
export function tileContent(pw: number, ph: number): TileContent {
  return {
    showName: pw > 60 && ph > 56,
    showPct: pw > 50 && ph > 34,
    pctSize: pw > 260 && ph > 160 ? '34px' : pw > 140 ? '22px' : '15px',
    pad: ph < 60 ? '6px 10px' : '12px',
  }
}
