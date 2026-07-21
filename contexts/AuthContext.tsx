'use client'
import { createContext, useContext } from 'react'

// Phase 1 placeholder — Phase 2 (task 2.1) replaces this with the real
// `AuthContext`: `/auth/me` bootstrap via React Query, `login`/`register`/
// `logout`/`forgotPassword`/`resetPassword`, and wiring
// `setUnauthorizedHandler` from `lib/api.ts` to invalidate `['auth', 'me']`
// and redirect on session expiry. This stub only exists so
// `app/providers.tsx` has a stable `<AuthProvider>` mount point ahead of
// that work — see `sdd/user-authentication/apply-progress`.

interface AuthContextValue {
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({ isLoading: false })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ isLoading: false }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
