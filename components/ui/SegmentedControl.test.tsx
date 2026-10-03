import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

const OPTIONS = [
  { value: 'total', label: 'Total' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M', disabled: true },
]

describe('SegmentedControl — rendering', () => {
  it('renders every option label', () => {
    render(<SegmentedControl options={OPTIONS} value="total" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'Total' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '1M' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '3M' })).toBeInTheDocument()
  })

  it('marks the active option with aria-selected=true and the rest false', () => {
    render(<SegmentedControl options={OPTIONS} value="1m" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: '1M' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Total' })).toHaveAttribute('aria-selected', 'false')
  })
})

describe('SegmentedControl — selection', () => {
  it('calls onChange with the clicked option value', () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="total" onChange={onChange} />)

    fireEvent.click(screen.getByRole('tab', { name: '1M' }))

    expect(onChange).toHaveBeenCalledWith('1m')
  })

  it('does not call onChange when clicking a disabled option', () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="total" onChange={onChange} />)

    fireEvent.click(screen.getByRole('tab', { name: '3M' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders the disabled option with the disabled attribute', () => {
    render(<SegmentedControl options={OPTIONS} value="total" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: '3M' })).toBeDisabled()
  })
})

describe('SegmentedControl — keyboard navigation', () => {
  it('ArrowRight from the active tab moves selection to the next enabled option', () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="total" onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Total' }), { key: 'ArrowRight' })

    expect(onChange).toHaveBeenCalledWith('1m')
  })

  it('ArrowRight skips a disabled option and wraps around to the first enabled option', () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="1m" onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('tab', { name: '1M' }), { key: 'ArrowRight' })

    expect(onChange).toHaveBeenCalledWith('total')
  })

  it('ArrowLeft from the active tab moves selection to the previous enabled option', () => {
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="1m" onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('tab', { name: '1M' }), { key: 'ArrowLeft' })

    expect(onChange).toHaveBeenCalledWith('total')
  })
})

describe('SegmentedControl — roving tabindex', () => {
  it('gives tabIndex=0 to the selected tab and -1 to the others when it is enabled', () => {
    render(<SegmentedControl options={OPTIONS} value="1m" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: '1M' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Total' })).toHaveAttribute('tabindex', '-1')
  })

  it('moves the tab stop to the first enabled tab when the selected tab is disabled', () => {
    render(<SegmentedControl options={OPTIONS} value="3m" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'Total' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: '1M' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tab', { name: '3M' })).toHaveAttribute('tabindex', '-1')
  })
})
