'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { carteras as carterasApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { Cartera } from '@/types'

// Selection is persisted client-side only — see design.md ("Active cartera
// state"): no backend change needed to "remember" the previous cartera.
const ACTIVE_CARTERA_KEY = 'active_cartera_id'

interface CarteraContextValue {
  carteraId: number | null
  setCarteraId: (id: number | null) => void
  carteras: Cartera[]
  isLoading: boolean
}

const CarteraContext = createContext<CarteraContextValue>({
  carteraId: null,
  setCarteraId: () => {},
  carteras: [],
  isLoading: false,
})

function readStoredCarteraId(): number | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(ACTIVE_CARTERA_KEY)
  return stored ? Number(stored) : null
}

function persistCarteraId(id: number | null) {
  if (typeof window === 'undefined') return
  if (id === null) {
    window.localStorage.removeItem(ACTIVE_CARTERA_KEY)
  } else {
    window.localStorage.setItem(ACTIVE_CARTERA_KEY, String(id))
  }
}

// Exposed for `AuthContext.logout()` — a plain function, not a hook, so it
// can be called regardless of provider nesting order. Without this, a fresh
// login would restore a previous user's cartera selection from localStorage
// (cross-user leak fix; see design.md gap noted during Phase 3 security review).
export function clearActiveCarteraSelection() {
  persistCarteraId(null)
}

export function CarteraProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  // Gated on `user`: without this, the query fires unauthenticated on
  // public pages too (CarteraProvider is mounted app-wide), and its 401
  // hits the global interceptor's redirect-to-login handler — which can
  // race a real login's own navigation and bounce the user straight back
  // to `/login`, looking like login "never completes".
  const { data: carteras = [], isLoading } = useQuery({
    queryKey: ['carteras'],
    queryFn: carterasApi.listar,
    enabled: !!user,
  })
  const [carteraId, setCarteraIdState] = useState<number | null>(null)

  // Zero-cartera behavior (portfolio-selection spec): keep `carteraId = null`
  // instead of falling back to a fake id — dependent queries stay disabled
  // and pages render an empty state.
  //
  // Otherwise: keep the current selection if it's still in the list
  // (covers refetches and cartera list changes), restore the previously
  // remembered selection if it's still valid, or default to the first
  // available cartera.
  useEffect(() => {
    if (isLoading) return
    if (carteras.length === 0) {
      setCarteraIdState(null)
      return
    }
    setCarteraIdState(prev => {
      if (prev != null && carteras.some(c => c.id === prev)) return prev
      const storedId = readStoredCarteraId()
      if (storedId != null && carteras.some(c => c.id === storedId)) return storedId
      return carteras[0].id
    })
  }, [carteras, isLoading])

  function setCarteraId(id: number | null) {
    setCarteraIdState(id)
    persistCarteraId(id)
  }

  return (
    <CarteraContext.Provider value={{ carteraId, setCarteraId, carteras, isLoading }}>
      {children}
    </CarteraContext.Provider>
  )
}

export function useActiveCartera() {
  return useContext(CarteraContext)
}
