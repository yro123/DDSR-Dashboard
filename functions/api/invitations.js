import { requireAdminUser } from '../lib/authz.js'

function nanoid(len = 21) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  for (const byte of arr) id += chars[byte % chars.length]
  return id
}

export async function onRequestGet({ env, request }) {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  // Join to get a reliable client slug (we keep the denormalized column populated only for the NOT NULL constraint).
  const { results } = await env.ddsr_dashboard.prepare(
    `SELECT i.*, u.email as createdByEmail, c.slug as clientSlug, c.name as clientName
     FROM invitations i
     LEFT JOIN user u ON u.id = i.createdBy
     LEFT JOIN clients c ON c.id = i.client_id
     ORDER BY i.expiresAt DESC`
  ).all()
  return Response.json(results)
}

export async function onRequestPost({ env, request }) {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  const body = await request.json()
  const targetSlug = body.slug
  const { email, personIds = [] } = body

  if (!targetSlug) return Response.json({ error: 'slug is required' }, { status: 400 })

  const client = await env.ddsr_dashboard
    .prepare('SELECT id FROM clients WHERE slug = ? LIMIT 1')
    .bind(targetSlug)
    .first()

  if (!client) {
    return Response.json({ error: 'Client not found' }, { status: 404 })
  }

  const now = Date.now()
  const expires = now + 7 * 24 * 60 * 60 * 1000 // 7 days
  const createdInvites = []

  // Bulk invite from People directory (preferred flow)
  if (Array.isArray(personIds) && personIds.length > 0) {
    for (const personId of personIds) {
      const person = await env.ddsr_dashboard
        .prepare('SELECT id, email FROM people WHERE id = ? AND project_id IN (SELECT id FROM projects WHERE client_id = ?)')
        .bind(personId, client.id)
        .first()

      if (!person || !person.email) continue

      const id = nanoid()
      const token = nanoid(32)

      // We still write clientSlug on the invitations row to satisfy the historical NOT NULL constraint.
      // All access logic uses client_id. The denormalized string on invitations is now only for display.
      await env.ddsr_dashboard.prepare(
        `INSERT INTO invitations (id, token, clientSlug, client_id, createdBy, email, expiresAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, token, targetSlug, client.id, admin.id, person.email, expires).run()

      await env.ddsr_dashboard.prepare(
        `UPDATE people SET invited_at = ?, invited_by = ? WHERE id = ?`
      ).bind(new Date().toISOString(), admin.id, person.id).run()

      const origin = new URL(request.url).origin
      createdInvites.push({
        personId: person.id,
        email: person.email,
        token,
        url: `${origin}/invite?token=${token}`
      })
    }

    return Response.json({ invites: createdInvites }, { status: 201 })
  }

  // Legacy single-email invite flow
  if (!email) {
    return Response.json({ error: 'email or personIds is required' }, { status: 400 })
  }

  const id = nanoid()
  const token = nanoid(32)

  // Historical NOT NULL on clientSlug column forces us to keep populating it for now.
  await env.ddsr_dashboard.prepare(
    `INSERT INTO invitations (id, token, clientSlug, client_id, createdBy, email, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, token, targetSlug, client.id, admin.id, email, expires).run()

  const origin = new URL(request.url).origin
  return Response.json({ token, url: `${origin}/invite?token=${token}` }, { status: 201 })
}
