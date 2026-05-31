import { requireSession } from './lib/authz.js'

export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)

  if (!url.pathname.startsWith('/api/')) return next()
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
