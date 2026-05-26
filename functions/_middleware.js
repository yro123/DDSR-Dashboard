import { createAuth } from './lib/auth'

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url)

  if (!url.pathname.startsWith('/api/')) return next()
  if (url.pathname.startsWith('/api/auth/')) return next()
  if (url.pathname === '/api/healthz') return next()

  // Allow unauthenticated GET for invite token preview
  if (/^\/api\/invitations\/[^/]+$/.test(url.pathname) && request.method === 'GET') return next()

  try {
    const auth = createAuth(env)
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    return next()
  } catch (err) {
    console.error('[middleware]', err)
    return Response.json({ error: err?.message || 'Middleware error', stack: err?.stack }, { status: 500 })
  }
}
