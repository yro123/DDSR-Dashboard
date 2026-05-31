import { requireSession, requireAdminUser, isAdmin } from '../../lib/authz.js'

export async function onRequestGet({ env, params }) {
  const invite = await env.ddsr_dashboard.prepare(
    `SELECT i.*, c.slug as resolvedSlug
     FROM invitations i
     LEFT JOIN clients c ON c.id = i.client_id
     WHERE i.token = ?`
  ).bind(params.token).first()

  if (!invite) return Response.json({ error: 'Invalid invite link' }, { status: 404 })
  if (invite.usedAt) return Response.json({ error: 'This invite has already been used' }, { status: 410 })
  if (Date.now() > invite.expiresAt) return Response.json({ error: 'This invite has expired' }, { status: 410 })

  // Return a reliable slug derived from client_id when possible.
  return Response.json({ clientSlug: invite.resolvedSlug || invite.clientSlug, email: invite.email })
}

export async function onRequestPost({ env, params, request }) {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const invite = await env.ddsr_dashboard.prepare(
    'SELECT * FROM invitations WHERE token = ?'
  ).bind(params.token).first()

  if (!invite) return Response.json({ error: 'Invalid invite link' }, { status: 404 })
  if (invite.usedAt) return Response.json({ error: 'Already used' }, { status: 410 })
  if (Date.now() > invite.expiresAt) return Response.json({ error: 'Expired' }, { status: 410 })

  const now = Date.now()

  // client_id is authoritative. The old clientSlug column on the invite row is ignored for access.
  const clientId = invite.client_id

  // Create proper membership (source of truth)
  if (clientId) {
    await env.ddsr_dashboard.prepare(`
      INSERT OR IGNORE INTO user_clients (user_id, client_id, role, created_at, updated_at)
      VALUES (?, ?, 'member', ?, ?)
    `).bind(session.user.id, clientId, new Date().toISOString(), new Date().toISOString()).run()
  }

  // Link to people directory record if email matches
  if (invite.email && clientId) {
    const person = await env.ddsr_dashboard
      .prepare(`
        SELECT p.id FROM people p
        JOIN projects pr ON pr.id = p.project_id
        WHERE LOWER(p.email) = LOWER(?) AND pr.client_id = ? AND p.user_id IS NULL
        LIMIT 1
      `)
      .bind(invite.email, clientId)
      .first()

    if (person) {
      await env.ddsr_dashboard.prepare(
        'UPDATE people SET user_id = ?, updated_at = ? WHERE id = ?'
      ).bind(session.user.id, new Date().toISOString(), person.id).run()
    }
  }

  await env.ddsr_dashboard.prepare(
    `UPDATE invitations SET usedAt = ?, usedBy = ? WHERE token = ?`
  ).bind(now, session.user.id, params.token).run()

  // Resolve a nice slug for the frontend success redirect / display
  let resolvedSlug = null
  if (clientId) {
    const c = await env.ddsr_dashboard.prepare('SELECT slug FROM clients WHERE id = ?').bind(clientId).first()
    resolvedSlug = c?.slug
  }

  return Response.json({ clientSlug: resolvedSlug, clientId })
}

export async function onRequestDelete({ env, params, request }) {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  await env.ddsr_dashboard.prepare(
    'DELETE FROM invitations WHERE token = ?'
  ).bind(params.token).run()
  return Response.json({ deleted: true })
}
