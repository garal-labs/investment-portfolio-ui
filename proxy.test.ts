import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { proxy } from './proxy'

function makeRequest(pathname: string, sessionCookie?: string) {
  const url = `https://example.com${pathname}`
  const headers = sessionCookie ? { cookie: `access_token=${sessionCookie}` } : undefined
  return new NextRequest(url, headers ? { headers } : undefined)
}

describe('proxy — route protection', () => {
  it('redirects unauthenticated requests for protected routes to /login', () => {
    const response = proxy(makeRequest('/dashboard'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/login')
  })

  it('allows authenticated requests through to protected routes', () => {
    const response = proxy(makeRequest('/movimientos', 'valid-session'))
    expect(response.headers.get('location')).toBeNull()
  })

  it('allows public auth routes without a session cookie', () => {
    const response = proxy(makeRequest('/login'))
    expect(response.headers.get('location')).toBeNull()
  })

  it('matches nested protected paths', () => {
    const response = proxy(makeRequest('/dashboard/settings'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/login')
  })
})
