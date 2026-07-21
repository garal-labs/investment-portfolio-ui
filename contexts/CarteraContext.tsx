'use client'
import { createContext, useContext } from 'react'

// Phase 1 placeholder — Phase 3 (task 3.1) replaces this with the real
// `CarteraContext`: loads the user's carteras from `GET /carteras`,
// persists `active_cartera_id` in localStorage, restores the prior
// selection, and keeps `carteraId = null` when the user has none. This stub
// only exists so `app/providers.tsx` has a stable `<CarteraProvider>` mount
// point ahead of that work — see `sdd/user-authentication/apply-progress`.
// `lib/config.ts#DEFAULT_CARTERA_ID` stays in place until Phase 3 rewires
// the pages that still import it (task 3.3).

interface CarteraContextValue {
  carteraId: number | null
  isLoading: boolean
}

const CarteraContext = createContext<CarteraContextValue>({ carteraId: null, isLoading: false })

export function CarteraProvider({ children }: { children: React.ReactNode }) {
  return (
    <CarteraContext.Provider value={{ carteraId: null, isLoading: false }}>
      {children}
    </CarteraContext.Provider>
  )
}

export function useActiveCartera() {
  return useContext(CarteraContext)
}
