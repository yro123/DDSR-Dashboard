import { createAuth } from './lib/auth'

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url)

  if (!url.pathname.startsWith('/api/')) return next()
  if (url.pathname.startsWith('/api/auth/'))  return next()

  // Allow unauthenticated GET for invite token preview
  if (/^\/api\/invitations\/[^/]+$/.test(url.pathname) && request.method === 'GET') return next()

  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  return next()
}
