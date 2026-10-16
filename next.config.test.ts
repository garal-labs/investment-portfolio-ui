import { describe, expect, it } from 'vitest'
import nextConfig from './next.config'

describe('next.config — legacy /analisis redirect', () => {
  it('permanently redirects /analisis and nested paths to /markowitz', async () => {
    const redirects = await nextConfig.redirects!()
    expect(redirects).toEqual(
      expect.arrayContaining([
        { source: '/analisis', destination: '/markowitz', permanent: true },
        { source: '/analisis/:path*', destination: '/markowitz/:path*', permanent: true },
      ]),
    )
  })
})
