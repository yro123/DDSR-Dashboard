import { requireSession } from './lib/authz'
import type { Ctx } from './lib/types'

// State-changing methods get an Origin check (CSRF defense for cookie auth).
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
// Known first-party origins. The request's own origin is also always allowed,
// so preview deployments (*.pages.dev) keep working.
const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'https://ddsr-dashboard.pages.dev',
  'https://dashboards.datadrivensr.com',
])

export async function onRequest(context: Ctx): Promise<Response> {
  const { request, next } = context
  const url = new URL(request.url)

  if (!url.pathname.startsWith('/api/')) return next()

  // CSRF defense: for cookie-authenticated mutations, reject cross-site Origins.
  // Browsers always send Origin on cross-origin (and same-origin) state changes;
  // non-browser clients omit it and carry no ambient cookies, so they're not a
  // CSRF vector. Applied before the auth bypasses so it also covers /api/auth/*.
  if (MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get('Origin')
    if (origin && origin !== url.origin && !ALLOWED_ORIGINS.has(origin)) {
      return Response.json({ error: 'Cross-origin request blocked' }, { status: 403 })
    }
  }

  if (url.pathname.startsWith('/api/auth/')) return next()
  if (url.pathname === '/api/healthz') return next()

  // Allow unauthenticated GET for invite token preview
  if (/^\/api\/invitations\/[^/]+$/.test(url.pathname) && request.method === 'GET') return next()

  // Enforce authentication for everything else under /api
  const sessionOrResponse = await requireSession(request, context.env)
  if (sessionOrResponse instanceof Response) {
    return sessionOrResponse
  }

  // Attach session for downstream handlers (use context.data)
  context.data = context.data || {}
  context.data.session = sessionOrResponse

  return next()
}
