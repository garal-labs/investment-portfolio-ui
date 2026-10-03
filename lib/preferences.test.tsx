import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PreferencesProvider, usePreferences } from './preferences'

const STORAGE_KEY = 'garal.preferences.v1'

function Probe() {
  const { privacy, density, setPrivacy, setDensity } = usePreferences()
  return (
    <div>
      <span data-testid="privacy">{String(privacy)}</span>
      <span data-testid="density">{density}</span>
      <button onClick={() => setPrivacy(true)}>enable-privacy</button>
      <button onClick={() => setDensity('compact')}>set-compact</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <PreferencesProvider>
      <Probe />
    </PreferencesProvider>,
  )
}

// Note: React Testing Library's `render()` flushes effects synchronously
// (inside `act()`), so a "pre-effect DOM snapshot" cannot be observed here —
// by the time `render()` returns, `useEffect` has already run. The SSR-safe
// guarantee (first render uses DEFAULTS, localStorage is only read inside
// `useEffect`, never during render) is enforced structurally in
// `lib/preferences.tsx` and mirrors the proven pattern in
// `contexts/CarteraContext.tsx`. The hydration test below covers the
// observable contract: whatever was in localStorage before mount ends up in
// context state after mount.
describe('PreferencesContext — post-mount hydration', () => {
  it('hydrates privacy=true, density=compact from localStorage after mount', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ privacy: true, density: 'compact' }))

    renderWithProvider()

    await waitFor(() => expect(screen.getByTestId('privacy').textContent).toBe('true'))
    expect(screen.getByTestId('density').textContent).toBe('compact')
  })

  it('keeps defaults when localStorage has no stored preferences', async () => {
    renderWithProvider()

    await waitFor(() => expect(screen.getByTestId('privacy').textContent).toBe('false'))
    expect(screen.getByTestId('density').textContent).toBe('comfortable')
  })
})

describe('PreferencesContext — setters persist to localStorage', () => {
  it('setPrivacy updates state and writes through to localStorage', async () => {
    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('privacy').textContent).toBe('false'))

    fireEvent.click(screen.getByText('enable-privacy'))

    expect(screen.getByTestId('privacy').textContent).toBe('true')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ privacy: true })
  })

  it('setDensity updates state and writes through to localStorage', async () => {
    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('density').textContent).toBe('comfortable'))

    fireEvent.click(screen.getByText('set-compact'))

    expect(screen.getByTestId('density').textContent).toBe('compact')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ density: 'compact' })
  })
})

describe('PreferencesContext — resilient storage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to defaults when localStorage.getItem throws', async () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('privacy').textContent).toBe('false'))
    expect(screen.getByTestId('density').textContent).toBe('comfortable')
  })

  it('still updates state when localStorage.setItem throws', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    renderWithProvider()
    fireEvent.click(screen.getByText('enable-privacy'))
    expect(screen.getByTestId('privacy').textContent).toBe('true')
  })

  it('persists exactly once per change, outside the state updater', () => {
    const spy = vi.spyOn(window.localStorage, 'setItem')
    renderWithProvider()
    fireEvent.click(screen.getByText('enable-privacy'))
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['non-boolean privacy', { privacy: 'yes', density: 'compact' }, 'false', 'compact'],
    ['numeric privacy', { privacy: 1, density: 'comfortable' }, 'false', 'comfortable'],
    ['unknown density', { privacy: true, density: 'huge' }, 'true', 'comfortable'],
    ['non-object JSON', 42, 'false', 'comfortable'],
    ['null JSON', null, 'false', 'comfortable'],
  ])('ignores invalid stored values: %s', async (_name, stored, privacy, density) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('density').textContent).toBe(density))
    expect(screen.getByTestId('privacy').textContent).toBe(privacy)
  })

  it('falls back to defaults on malformed JSON', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('privacy').textContent).toBe('false'))
  })
})

describe('PreferencesContext — privacy flash', () => {
  it('is masked (privacy=true) before preferences are hydrated, so no unmasked first paint', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ privacy: true }))
    const html = renderToString(
      <PreferencesProvider>
        <Probe />
      </PreferencesProvider>,
    )
    expect(html).toContain('<span data-testid="privacy">true</span>')
  })

  it('settles to the stored value after hydration', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ privacy: false }))
    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('privacy').textContent).toBe('false'))
  })
})
