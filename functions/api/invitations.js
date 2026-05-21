import { createAuth } from '../lib/auth'

function nanoid(len = 21) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  for (const byte of arr) id += chars[byte % chars.length]
  return id
}

export async function onRequestGet({ env, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { results } = await env.ddsr_dashboard.prepare(
    `SELECT i.*, u.email as createdByEmail FROM invitations i
     LEFT JOIN user u ON u.id = i.createdBy
     ORDER BY i.expiresAt DESC`
  ).all()
  return Response.json(results)
}

export async function onRequestPost({ env, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { clientSlug, email } = await request.json()
  if (!clientSlug) return Response.json({ error: 'clientSlug required' }, { status: 400 })

  const id    = nanoid()
  const token = nanoid(32)
  const now   = Date.now()
  const expires = now + 7 * 24 * 60 * 60 * 1000 // 7 days

  await env.ddsr_dashboard.prepare(
    `INSERT INTO invitations (id, token, clientSlug, createdBy, email, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, token, clientSlug, session.user.id, email || null, expires).run()

  const invite = await env.ddsr_dashboard.prepare(
    'SELECT * FROM invitations WHERE id = ?'
  ).bind(id).first()
  return Response.json(invite, { status: 201 })
}
