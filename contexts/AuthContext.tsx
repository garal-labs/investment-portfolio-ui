'use client'
import { createContext, useContext, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { auth, setUnauthorizedHandler } from '@/lib/api'
import { clearActiveCarteraSelection } from '@/contexts/CarteraContext'
import type { LoginPayload, RegisterPayload, ResetPasswordPayload, User } from '@/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (data: LoginPayload) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (data: ResetPasswordPayload) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Single source of truth for "who is logged in" — see design.md
// ("Auth state source of truth"): the cookie is httpOnly and opaque to JS,
// so `/auth/me` is the only way to know the current session.
const ME_KEY = ['auth', 'me']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: user, isLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await auth.me()
      } catch {
        // A 401 here means "not logged in" — an expected state on public
        // pages, not an error to surface (design.md 401-exclusion policy).
        return null
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  })

  // Any protected-resource request that gets a 401 (i.e. not one of the
  // AUTH_401_REDIRECT_EXCLUSIONS in lib/api.ts) lands here: drop the cached
  // user and send the visitor back to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(ME_KEY, null)
      router.replace('/login')
    })
  }, [queryClient, router])

  async function login(data: LoginPayload) {
    await auth.login(data)
    // Broadened from `ME_KEY`-only: queries mounted at the app root (e.g.
    // CarteraContext's `['carteras']`) live for the whole app lifetime and
    // never unmount between a logout and the next login, so they must be
    // told the identity changed too — otherwise they keep serving the
    // previous session's response instead of refetching against the new
    // one (confirmed while building the logout cache-isolation regression
    // test: mounted queries do not self-refresh on their own).
    await queryClient.invalidateQueries()
  }

  async function register(data: RegisterPayload) {
    await auth.register(data)
    await queryClient.invalidateQueries({ queryKey: ME_KEY })
  }

  async function logout() {
    await auth.logout()
    // Immediately reflect "logged out" for the auth-state query itself.
    // `resetQueries()`/`clear()` do NOT synchronously notify observers that
    // are already mounted (AuthProvider's own `['auth','me']` query is
    // exactly such an observer — it lives for the app's lifetime) — only an
    // explicit `setQueryData` does. Confirmed empirically: without this,
    // the UI kept rendering the logged-out user until an unrelated refetch
    // happened to fire.
    queryClient.setQueryData(ME_KEY, null)
    // Reset every OTHER cached query — not just `['auth','me']`.
    // `['carteras']` (CarteraContext) and `['resumen'|'analisis'|
    // 'movimientos', carteraId]` (useCartera.ts) are user-scoped and must
    // not survive into the next session. `resetQueries()` (not `clear()`)
    // is required here: `clear()` only removes cache *entries*, it does not
    // notify already-mounted observers (same gap as above) — CarteraContext
    // never unmounts across this transition, so `clear()` alone left it
    // rendering the previous user's cartera list in testing.
    // `resetQueries()` with no key filter over enumerating keys: new
    // cartera-scoped keys added later would otherwise be missed (original
    // security review finding).
    await queryClient.resetQueries({ predicate: query => query.queryKey[0] !== 'auth' })
    // The active cartera selection is also user-scoped — clearing it
    // prevents a fresh login from restoring a previous user's choice.
    clearActiveCarteraSelection()
    router.replace('/login')
  }

  const value: AuthContextValue = {
    user: user ?? null,
    isLoading,
    login,
    register,
    logout,
    forgotPassword: auth.forgotPassword,
    resetPassword: auth.resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
