import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/test/mocks/server'
import { fronteraEficienteFixture } from '@/test/mocks/fixtures/fronteraEficiente'
import api, { auth, isAuthRedirectExcluded, portfolio } from './api'

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

describe('portfolio.fronteraEficiente', () => {
  it('requests the cartera frontier with `anios` as a query param', async () => {
    let requested: URL | undefined
    server.use(
      http.get('/api/v1/carteras/:id/markowitz', ({ request }) => {
        requested = new URL(request.url)
        return HttpResponse.json(fronteraEficienteFixture)
      }),
    )

    const data = await portfolio.fronteraEficiente(7, 3)

    expect(requested?.pathname).toBe('/api/v1/carteras/7/markowitz')
    expect(requested?.searchParams.get('anios')).toBe('3')
    expect(data.tickers).toEqual(['AAPL', 'MSFT', 'SAN.MC'])
  })

  it('serves a dimensionally consistent default fixture', async () => {
    const data = await portfolio.fronteraEficiente(1, 5)
    const k = data.tickers.length
    const { datos, estadisticas, cartera_actual } = data.detalle

    expect(datos.fechas).toHaveLength(data.n_observaciones)
    expect(datos.fechas_precios).toHaveLength(datos.fechas.length + 1)
    expect(datos.precios.every(row => row.length === k)).toBe(true)
    expect(datos.rentabilidades.every(row => row.length === k)).toBe(true)
    for (const m of [data.matriz_covarianzas, estadisticas.matriz_correlaciones]) {
      expect(m).toHaveLength(k)
      expect(m.every(row => row.length === k)).toBe(true)
    }
    expect(cartera_actual.rentabilidades).toHaveLength(data.n_observaciones)

    const sum = (pesos: Record<string, number>) => Object.values(pesos).reduce((a, b) => a + b, 0)
    for (const punto of [...data.frontera, data.cartera_actual, data.cartera_minima_varianza]) {
      expect(sum(punto.pesos)).toBeCloseTo(1, 9)
    }
    const returns = data.frontera.map(p => p.rentabilidad)
    expect(returns).toEqual([...returns].sort((a, b) => a - b))
    expect(data.frontera[0]).toEqual(data.cartera_minima_varianza)
  })
})
