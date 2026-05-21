import { createAuth } from '../lib/auth'

export async function onRequestGet({ env, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { results } = await env.ddsr_dashboard.prepare(
    `SELECT id, name, email, emailVerified, clientSlug, isAdmin, createdAt FROM user ORDER BY createdAt DESC`
  ).all()
  return Response.json(results)
}
