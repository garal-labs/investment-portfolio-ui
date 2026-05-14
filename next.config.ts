import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Optimiza el bundle para despliegue en Vercel / contenedores
  output: 'standalone',
}

export default nextConfig
