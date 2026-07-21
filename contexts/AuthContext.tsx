'use client'
import { createContext, useContext, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { auth, setUnauthorizedHandler } from '@/lib/api'
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
    await queryClient.invalidateQueries({ queryKey: ME_KEY })
  }

  async function register(data: RegisterPayload) {
    await auth.register(data)
    await queryClient.invalidateQueries({ queryKey: ME_KEY })
  }

  async function logout() {
    await auth.logout()
    queryClient.setQueryData(ME_KEY, null)
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
