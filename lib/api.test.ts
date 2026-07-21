import { describe, expect, it } from 'vitest'
import api, { auth, isAuthRedirectExcluded } from './api'

describe('api client', () => {
  it('uses a relative /api/v1 base URL (same-origin via next.config.ts rewrite)', () => {
    expect(api.defaults.baseURL).toBe('/api/v1')
    expect(api.defaults.withCredentials).toBeFalsy()
  })

  it('fetches the current user through the auth client', async () => {
    const user = await auth.me()
    expect(user.email).toBe('demo@example.com')
  })
})

describe('isAuthRedirectExcluded', () => {
  it('excludes auth-form endpoints and /auth/me from the 401 redirect', () => {
    expect(isAuthRedirectExcluded('/api/v1/auth/login')).toBe(true)
    expect(isAuthRedirectExcluded('/api/v1/auth/register')).toBe(true)
    expect(isAuthRedirectExcluded('/api/v1/auth/forgot-password')).toBe(true)
    expect(isAuthRedirectExcluded('/api/v1/auth/reset-password')).toBe(true)
    expect(isAuthRedirectExcluded('/api/v1/auth/me')).toBe(true)
  })

  it('does not exclude protected-resource endpoints', () => {
    expect(isAuthRedirectExcluded('/api/v1/carteras')).toBe(false)
    expect(isAuthRedirectExcluded('/api/v1/movimientos')).toBe(false)
  })
})
