import type { KeyboardEvent } from 'react'

export interface SegmentedControlOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label'?: string
}

// Generic tab-pattern segmented control (ARIA APG "tabs" roving-tabindex
// behavior): ArrowRight/ArrowLeft move selection between enabled options,
// wrapping around and skipping disabled entries.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  function enabledIndices() {
    return options.reduce<number[]>((acc, o, i) => {
      if (!o.disabled) acc.push(i)
      return acc
    }, [])
  }

  function moveSelection(currentIndex: number, direction: 1 | -1) {
    const enabled = enabledIndices()
    if (enabled.length === 0) return
    const posInEnabled = enabled.indexOf(currentIndex)
    // If the current option is disabled/not found, start from the nearest edge.
    const base = posInEnabled === -1 ? 0 : posInEnabled
    const nextPos = (base + direction + enabled.length) % enabled.length
    const nextIndex = enabled[nextPos]
    onChange(options[nextIndex].value)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      moveSelection(index, 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      moveSelection(index, -1)
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 p-[3px] rounded-[9px]"
      style={{ background: '#efe9e2' }}
    >
      {options.map((o, index) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={o.disabled}
            tabIndex={active ? 0 : -1}
            onClick={() => !o.disabled && onChange(o.value)}
            onKeyDown={e => handleKeyDown(e, index)}
            className="px-3 py-1.5 text-[12px] font-medium rounded-[7px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: active ? '#fff' : 'transparent',
              color: active ? '#221e1a' : '#6a5a4a',
              boxShadow: active ? '0 1px 2px rgba(34,30,26,.12)' : 'none',
              border: 'none',
              cursor: o.disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
