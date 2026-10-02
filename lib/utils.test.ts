import { describe, expect, it } from 'vitest'
import { formatEur, formatCurrency, formatPct, formatPeso, TREEMAP_COLORS, treemapColor } from './utils'

describe('formatEur — es-ES currency formatting', () => {
  it('formats a positive amount with thousands grouping and comma decimals', () => {
    expect(formatEur(15852.0)).toBe('15.852,00 €')
  })

  it('uses U+2212 (minus sign) instead of ASCII hyphen for negative amounts', () => {
    const result = formatEur(-5.2)
    expect(result).toContain('−')
    expect(result).not.toContain('-')
  })

  it('returns an em dash placeholder for null/undefined', () => {
    expect(formatEur(null)).toBe('—')
    expect(formatEur(undefined)).toBe('—')
  })
})

describe('formatCurrency — es-ES currency formatting for any currency', () => {
  it('applies grouping and U+2212 minus for a non-EUR currency', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('1.234,50 US$')
    const negative = formatCurrency(-1234.5, 'USD')
    expect(negative).toContain('−')
    expect(negative).not.toContain('-')
  })
})

describe('formatPct — es-ES percentage formatting', () => {
  it('formats a positive percentage with a leading + and space before %', () => {
    expect(formatPct(34.25)).toBe('+34,25 %')
  })

  it('formats a negative percentage with U+2212 and space before %', () => {
    expect(formatPct(-5.2)).toBe('−5,20 %')
  })

  it('returns an em dash placeholder for null/undefined', () => {
    expect(formatPct(null)).toBe('—')
    expect(formatPct(undefined)).toBe('—')
  })
})

describe('formatPeso — 1-decimal weight percentage', () => {
  it('converts a 0-1 fraction into a 1-decimal es-ES percentage', () => {
    expect(formatPeso(0.184)).toBe('18,4 %')
  })

  it('returns an em dash placeholder for null/undefined', () => {
    expect(formatPeso(null)).toBe('—')
    expect(formatPeso(undefined)).toBe('—')
  })
})

describe('TREEMAP_COLORS / treemapColor — 9-entry palette with wraparound', () => {
  it('has exactly 9 background/text color pairs in weight order', () => {
    expect(TREEMAP_COLORS).toHaveLength(9)
    expect(TREEMAP_COLORS[0]).toEqual({ bg: '#2D6A5A', text: '#fff' })
    expect(TREEMAP_COLORS[8]).toEqual({ bg: '#a09080', text: '#221e1a' })
  })

  it('wraps around every 9 entries', () => {
    expect(treemapColor(9)).toBe(treemapColor(0))
    expect(treemapColor(11)).toBe(treemapColor(2))
  })

  it('returns distinct colors for distinct indices within the palette', () => {
    expect(treemapColor(0)).not.toBe(treemapColor(1))
  })
})
