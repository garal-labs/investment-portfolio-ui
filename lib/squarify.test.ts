import { describe, expect, it } from 'vitest'
import { squarify, tileContent, type SquarifyItem } from './squarify'

describe('squarify — area conservation', () => {
  it('sums rect areas to (approximately) the container area', () => {
    const items: SquarifyItem[] = [
      { key: 'a', v: 60 },
      { key: 'b', v: 25 },
      { key: 'c', v: 10 },
      { key: 'd', v: 5 },
    ]
    const rects = squarify(items, 0, 0, 200, 100)
    const totalArea = rects.reduce((sum, r) => sum + r.w * r.h, 0)
    expect(totalArea).toBeCloseTo(200 * 100, 5)
  })

  it('conserves area for a single dominant item among many small ones', () => {
    const items: SquarifyItem[] = [
      { key: 'big', v: 1000 },
      { key: 'tiny1', v: 1 },
      { key: 'tiny2', v: 1 },
      { key: 'tiny3', v: 1 },
    ]
    const rects = squarify(items, 0, 0, 300, 150)
    const totalArea = rects.reduce((sum, r) => sum + r.w * r.h, 0)
    expect(totalArea).toBeCloseTo(300 * 150, 5)
  })
})

describe('squarify — single item', () => {
  it('covers the full container exactly', () => {
    const items: SquarifyItem[] = [{ key: 'only', v: 42 }]
    const rects = squarify(items, 10, 20, 200, 100)
    expect(rects).toEqual([{ key: 'only', v: 42, x: 10, y: 20, w: 200, h: 100 }])
  })
})

describe('squarify — orientation flip', () => {
  it('wide container: the first placed row spans the full container height', () => {
    const items: SquarifyItem[] = [
      { key: 'a', v: 90 },
      { key: 'b', v: 5 },
      { key: 'c', v: 5 },
    ]
    const rects = squarify(items, 0, 0, 200, 100)
    // In the w>=h branch, each row occupies a full-height column before
    // recursing to the right — so the first rect's height equals the
    // container height.
    expect(rects[0].h).toBeCloseTo(100, 5)
  })

  it('tall container: the first placed row spans the full container width', () => {
    const items: SquarifyItem[] = [
      { key: 'a', v: 90 },
      { key: 'b', v: 5 },
      { key: 'c', v: 5 },
    ]
    const rects = squarify(items, 0, 0, 100, 200)
    // In the h>w branch, each row occupies a full-width band before
    // recursing downward — so the first rect's width equals the container
    // width.
    expect(rects[0].w).toBeCloseTo(100, 5)
  })
})

describe('squarify — ordering', () => {
  it('preserves descending-weight input order in the output', () => {
    const items: SquarifyItem[] = [
      { key: 'first', v: 50 },
      { key: 'second', v: 30 },
      { key: 'third', v: 20 },
    ]
    const rects = squarify(items, 0, 0, 200, 100)
    expect(rects.map(r => r.key)).toEqual(['first', 'second', 'third'])
  })
})

describe('squarify — empty input', () => {
  it('returns an empty array, not an error', () => {
    expect(squarify([], 0, 0, 100, 100)).toEqual([])
  })
})

describe('tileContent — visibility and sizing thresholds', () => {
  it('200x100 shows name+pct at 22px (not the 34px tier)', () => {
    const t = tileContent(200, 100)
    expect(t).toEqual({ showName: true, showPct: true, pctSize: '22px', pad: '12px' })
  })

  it('40x30 hides both name and percentage', () => {
    const t = tileContent(40, 30)
    expect(t.showName).toBe(false)
    expect(t.showPct).toBe(false)
  })

  it('pad is "6px 10px" at ph=59 and "12px" at ph=60', () => {
    expect(tileContent(200, 59).pad).toBe('6px 10px')
    expect(tileContent(200, 60).pad).toBe('12px')
  })

  it('pctSize is 34px only when pw>260 AND ph>160', () => {
    expect(tileContent(261, 161).pctSize).toBe('34px')
    expect(tileContent(261, 160).pctSize).toBe('22px')
    expect(tileContent(260, 161).pctSize).toBe('22px')
  })

  it('pctSize falls to 15px when pw<=140', () => {
    expect(tileContent(140, 100).pctSize).toBe('15px')
    expect(tileContent(141, 100).pctSize).toBe('22px')
  })
})

describe('squarify — zero totals', () => {
  const finite = (r: { x: number; y: number; w: number; h: number }) =>
    [r.x, r.y, r.w, r.h].every(Number.isFinite)

  it('never emits NaN/Infinity when all items are zero', () => {
    const items: SquarifyItem[] = [
      { key: 'a', v: 0 },
      { key: 'b', v: 0 },
      { key: 'c', v: 0 },
    ]
    const rects = squarify(items, 0, 0, 200, 100)
    expect(rects).toHaveLength(3)
    expect(rects.every(finite)).toBe(true)
    expect(rects.map(r => r.key)).toEqual(['a', 'b', 'c'])
    expect(rects.every(r => r.v === 0)).toBe(true)
  })

  it('never emits NaN/Infinity with trailing zero items', () => {
    const items: SquarifyItem[] = [
      { key: 'a', v: 50 },
      { key: 'b', v: 30 },
      { key: 'c', v: 0 },
      { key: 'd', v: 0 },
    ]
    const rects = squarify(items, 0, 0, 200, 100)
    expect(rects).toHaveLength(4)
    expect(rects.every(finite)).toBe(true)
  })
})
