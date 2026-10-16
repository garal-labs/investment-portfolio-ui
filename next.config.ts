import type { NextConfig } from 'next'

// Server-side only — never exposed to the browser (no NEXT_PUBLIC_ prefix).
// Browser calls stay same-origin via the rewrite below so the backend's
// httpOnly session cookie works under SameSite=Lax without relaxing CORS.
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8000'

const nextConfig: NextConfig = {
  // Optimiza el bundle para despliegue en Vercel / contenedores
  output: 'standalone',

  // The Markowitz page used to live at /analisis; keep old links working.
  async redirects() {
    return [
      { source: '/analisis', destination: '/markowitz', permanent: true },
      { source: '/analisis/:path*', destination: '/markowitz/:path*', permanent: true },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_API_URL}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
