import { createAuth } from '../lib/auth'

const isAdminUser = u => !!(u?.isAdmin) || u?.email?.endsWith('@datadrivensr.com')

export async function onRequestGet({ env, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!isAdminUser(session?.user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { results } = await env.ddsr_dashboard.prepare(
    `SELECT id, name, email, emailVerified, clientSlug, isAdmin, createdAt FROM user ORDER BY createdAt DESC`
  ).all()
  return Response.json(results)
}
