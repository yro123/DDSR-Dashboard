import { createAuth } from '../../lib/auth'

export async function onRequestGet({ env, params }) {
  const invite = await env.ddsr_dashboard.prepare(
    'SELECT * FROM invitations WHERE token = ?'
  ).bind(params.token).first()

  if (!invite) return Response.json({ error: 'Invalid invite link' }, { status: 404 })
  if (invite.usedAt) return Response.json({ error: 'This invite has already been used' }, { status: 410 })
  if (Date.now() > invite.expiresAt) return Response.json({ error: 'This invite has expired' }, { status: 410 })

  return Response.json({ clientSlug: invite.clientSlug, email: invite.email })
}

export async function onRequestPost({ env, params, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const invite = await env.ddsr_dashboard.prepare(
    'SELECT * FROM invitations WHERE token = ?'
  ).bind(params.token).first()

  if (!invite) return Response.json({ error: 'Invalid invite link' }, { status: 404 })
  if (invite.usedAt) return Response.json({ error: 'Already used' }, { status: 410 })
  if (Date.now() > invite.expiresAt) return Response.json({ error: 'Expired' }, { status: 410 })

  const now = Date.now()
  await env.ddsr_dashboard.prepare(
    `UPDATE user SET clientSlug = ?, updatedAt = ? WHERE id = ?`
  ).bind(invite.clientSlug, now, session.user.id).run()

  await env.ddsr_dashboard.prepare(
    `UPDATE invitations SET usedAt = ?, usedBy = ? WHERE token = ?`
  ).bind(now, session.user.id, params.token).run()

  return Response.json({ clientSlug: invite.clientSlug })
}

export async function onRequestDelete({ env, params, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  await env.ddsr_dashboard.prepare(
    'DELETE FROM invitations WHERE token = ?'
  ).bind(params.token).run()
  return Response.json({ deleted: true })
}
