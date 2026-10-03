import { act } from '@testing-library/react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Treemap } from './Treemap'
import type { CompositionGroup } from '@/lib/portfolio-calc'
import { treemapColor } from '@/lib/utils'

type ResizeCallback = (entries: { contentRect: { width: number } }[]) => void

class MockResizeObserver {
  static instances: MockResizeObserver[] = []
  callback: ResizeCallback
  constructor(cb: ResizeCallback) {
    this.callback = cb
    MockResizeObserver.instances.push(this)
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  trigger(width: number) {
    this.callback([{ contentRect: { width } }])
  }
}

beforeEach(() => {
  MockResizeObserver.instances = []
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function group(overrides: Partial<CompositionGroup> & { key: string; valor: number; peso: number }): CompositionGroup {
  return { name: overrides.key, count: 1, ...overrides }
}

describe('Treemap — rendering', () => {
  it('renders one tile per group', () => {
    const groups = [
      group({ key: 'a', name: 'Alpha', valor: 600, peso: 0.6 }),
      group({ key: 'b', name: 'Beta', valor: 400, peso: 0.4 }),
    ]
    render(<Treemap groups={groups} />)
    expect(screen.getAllByTestId('treemap-tile')).toHaveLength(2)
  })

  it('single group renders one tile covering 100% width and height', () => {
    const groups = [group({ key: 'only', name: 'Only', valor: 100, peso: 1 })]
    render(<Treemap groups={groups} />)
    const tile = screen.getByTestId('treemap-tile')
    expect(tile).toHaveStyle({ width: '100%', height: '100%' })
  })

  it('shows the native title tooltip with name and weight', () => {
    const groups = [group({ key: 'only', name: 'Only', valor: 100, peso: 1 })]
    render(<Treemap groups={groups} />)
    expect(screen.getByTitle('Only · 100,0 %')).toBeInTheDocument()
  })
})

describe('Treemap — palette wraparound at 12 groups', () => {
  it('reuses treemapColor(index % 9) per group in descending order', () => {
    const groups = Array.from({ length: 12 }, (_, i) =>
      group({ key: `g${i}`, name: `Group ${i}`, valor: 100 - i, peso: (100 - i) / 1000 }),
    )
    render(<Treemap groups={groups} />)
    const tiles = screen.getAllByTestId('treemap-tile')
    // group index 9 (10th) reuses palette color 0; index 10 reuses color 1.
    // jsdom normalizes inline hex colors to rgb(), so compare against a
    // detached probe element styled with the same hex value rather than
    // the raw hex string.
    const bgOf = (hex: string) => {
      const probe = document.createElement('div')
      probe.style.background = hex
      return probe.style.background
    }
    expect(tiles[9].querySelector('div')?.style.background).toBe(bgOf(treemapColor(0).bg))
    expect(tiles[10].querySelector('div')?.style.background).toBe(bgOf(treemapColor(1).bg))
    expect(tiles[11].querySelector('div')?.style.background).toBe(bgOf(treemapColor(2).bg))
  })
})

describe('Treemap — content visibility thresholds', () => {
  it('a tiny single group at a narrow container width hides name and percentage', () => {
    const groups = [group({ key: 'only', name: 'Only', valor: 100, peso: 1 })]
    render(<Treemap groups={groups} height={340} />)
    act(() => MockResizeObserver.instances[0].trigger(40))
    expect(screen.queryByText('Only')).not.toBeInTheDocument()
  })

  it('the default wide container shows both name and percentage', () => {
    const groups = [group({ key: 'only', name: 'Only', valor: 100, peso: 1 })]
    render(<Treemap groups={groups} height={340} />)
    expect(screen.getByText('Only')).toBeInTheDocument()
    expect(screen.getByText('100,0 %')).toBeInTheDocument()
  })
})

describe('Treemap — hover forwarding', () => {
  it('calls onHover with the group key on mouse enter', () => {
    const onHover = vi.fn()
    const groups = [
      group({ key: 'a', name: 'Alpha', valor: 600, peso: 0.6 }),
      group({ key: 'b', name: 'Beta', valor: 400, peso: 0.4 }),
    ]
    render(<Treemap groups={groups} onHover={onHover} />)
    fireEvent.mouseEnter(screen.getAllByTestId('treemap-tile')[0])
    expect(onHover).toHaveBeenCalledWith(expect.any(String))
  })

  it('calls onHover(null) on mouse leave of the container', () => {
    const onHover = vi.fn()
    const groups = [group({ key: 'a', name: 'Alpha', valor: 600, peso: 0.6 })]
    const { container } = render(<Treemap groups={groups} onHover={onHover} />)
    fireEvent.mouseLeave(container.firstChild as Element)
    expect(onHover).toHaveBeenCalledWith(null)
  })
})
