'use client'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { CarteraProvider } from '@/contexts/CarteraContext'
import { PreferencesProvider } from '@/lib/preferences'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CarteraProvider>
          <PreferencesProvider>
            {children}
          </PreferencesProvider>
        </CarteraProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
