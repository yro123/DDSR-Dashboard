import { createAuth } from '../../lib/auth'

export async function onRequestPut({ env, params, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { clientSlug, isAdmin } = await request.json()
  const now = Date.now()
  await env.ddsr_dashboard.prepare(
    `UPDATE user SET clientSlug = ?, isAdmin = ?, updatedAt = ? WHERE id = ?`
  ).bind(clientSlug ?? null, isAdmin ? 1 : 0, now, params.id).run()

  const user = await env.ddsr_dashboard.prepare(
    `SELECT id, name, email, emailVerified, clientSlug, isAdmin, createdAt FROM user WHERE id = ?`
  ).bind(params.id).first()
  return Response.json(user)
}

export async function onRequestDelete({ env, params, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })
  if (params.id === session.user.id) return Response.json({ error: 'Cannot delete your own account' }, { status: 400 })

  await env.ddsr_dashboard.prepare('DELETE FROM user WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
