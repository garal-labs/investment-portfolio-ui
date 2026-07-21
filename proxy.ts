import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` (same
// runtime behavior, new export name) — see
// node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
// `tasks.md` 1.3 says "Create middleware.ts"; this file is the Next 16
// equivalent and supersedes that filename per the deprecation notice.

const PROTECTED_PATHS = ['/dashboard', '/movimientos', '/analisis', '/ajustes']

// Confirmed against the backend design (sdd/user-authentication/design,
// garal-screener): httpOnly/Secure/SameSite=Lax cookie named `access_token`.
const AUTH_COOKIE_NAME = 'access_token'

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

// Cookie-presence check only — no JWT signature verification (no
// `JWT_SECRET` dependency in this repo). The backend still enforces auth
// per-request; this is defense-in-depth to avoid a content flash, not the
// authorization boundary itself.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const hasSession = request.cookies.has(AUTH_COOKIE_NAME)
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/movimientos/:path*', '/analisis/:path*', '/ajustes/:path*'],
}
