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

function readStoredPreferences(): Partial<Preferences> | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Partial<Preferences>
  } catch {
    return null
  }
}

function persistPreferences(prefs: Preferences) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe: first render always uses DEFAULTS (matches server output), and
  // localStorage is only read after mount via the effect below — mirrors the
  // pattern already used in contexts/CarteraContext.tsx to avoid a hydration
  // mismatch.
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS)

  useEffect(() => {
    const stored = readStoredPreferences()
    if (!stored) return
    setPrefs(prev => ({ ...prev, ...stored }))
  }, [])

  function setPrivacy(privacy: boolean) {
    setPrefs(prev => {
      const next = { ...prev, privacy }
      persistPreferences(next)
      return next
    })
  }

  function setDensity(density: Density) {
    setPrefs(prev => {
      const next = { ...prev, density }
      persistPreferences(next)
      return next
    })
  }

  return (
    <PreferencesContext.Provider value={{ ...prefs, setPrivacy, setDensity }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  return useContext(PreferencesContext)
}
