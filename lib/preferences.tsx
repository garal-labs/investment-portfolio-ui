'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type Density = 'comfortable' | 'compact'

export interface Preferences {
  privacy: boolean
  density: Density
}

const STORAGE_KEY = 'garal.preferences.v1'

const DEFAULTS: Preferences = { privacy: false, density: 'comfortable' }

interface PreferencesContextValue extends Preferences {
  setPrivacy: (privacy: boolean) => void
  setDensity: (density: Density) => void
}

const PreferencesContext = createContext<PreferencesContextValue>({
  ...DEFAULTS,
  setPrivacy: () => {},
  setDensity: () => {},
})

function isDensity(value: unknown): value is Density {
  return value === 'comfortable' || value === 'compact'
}

// Reads and validates stored preferences. Each field is validated
// independently; anything invalid (or a throwing/unavailable storage) falls
// back to the defaults.
function readStoredPreferences(): Preferences | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object') return null
    const { privacy, density } = parsed as Record<string, unknown>
    return {
      privacy: typeof privacy === 'boolean' ? privacy : DEFAULTS.privacy,
      density: isDensity(density) ? density : DEFAULTS.density,
    }
  } catch {
    return null
  }
}

function persistPreferences(prefs: Preferences) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Storage unavailable or full: preferences stay in memory for this session.
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe: first render always uses DEFAULTS (matches server output), and
  // localStorage is only read after mount via the effect below — mirrors the
  // pattern already used in contexts/CarteraContext.tsx to avoid a hydration
  // mismatch.
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readStoredPreferences()
    if (stored) setPrefs(stored)
    setHydrated(true)
  }, [])

  function update(patch: Partial<Preferences>) {
    // Persist outside the state updater: updaters must stay pure.
    const next = { ...prefs, ...patch }
    setPrefs(next)
    persistPreferences(next)
  }

  const setPrivacy = (privacy: boolean) => update({ privacy })
  const setDensity = (density: Density) => update({ density })

  // Until stored preferences are read we cannot know whether the user enabled
  // privacy, so fail closed: report privacy as on (amounts masked) rather than
  // flash real amounts. The server and the first client render agree (both
  // masked), so there is no hydration mismatch.
  const effectivePrivacy = hydrated ? prefs.privacy : true

  return (
    <PreferencesContext.Provider value={{ ...prefs, privacy: effectivePrivacy, setPrivacy, setDensity }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  return useContext(PreferencesContext)
}
