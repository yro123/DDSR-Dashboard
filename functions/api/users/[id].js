import { requireAdminUser } from '../../lib/authz.js'

export async function onRequestPut({ env, params, request }) {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  const body = await request.json()
  const { clientSlugs = [], isAdmin: makeAdmin } = body
  const now = Date.now()

  // clientSlug is completely removed from the user access model.
  // We accept clientSlugs[] to sync the user_clients join table (the single source of truth).
  const slugsToAssign = Array.isArray(clientSlugs) ? clientSlugs : []

  // Update only isAdmin + timestamp on the user row (no more clientSlug)
  await env.ddsr_dashboard.prepare(
    `UPDATE user SET isAdmin = ?, updatedAt = ? WHERE id = ?`
  ).bind(makeAdmin ? 1 : 0, now, params.id).run()

  // Replace memberships with the new set (source of truth)
  if (body.hasOwnProperty('clientSlugs')) {
    await env.ddsr_dashboard.prepare(
      'DELETE FROM user_clients WHERE user_id = ?'
    ).bind(params.id).run()

    for (const slug of slugsToAssign) {
      const client = await env.ddsr_dashboard
        .prepare('SELECT id FROM clients WHERE slug = ? LIMIT 1')
        .bind(slug)
        .first()

      if (client) {
        await env.ddsr_dashboard.prepare(`
          INSERT OR IGNORE INTO user_clients (user_id, client_id, role, created_at, updated_at)
          VALUES (?, ?, 'member', ?, ?)
        `).bind(params.id, client.id, new Date().toISOString(), new Date().toISOString()).run()
      }
    }
  }

  const updatedUser = await env.ddsr_dashboard.prepare(
    `SELECT id, name, email, emailVerified, isAdmin, createdAt FROM user WHERE id = ?`
  ).bind(params.id).first()

  return Response.json(updatedUser)
}

export async function onRequestDelete({ env, params, request }) {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin
  if (params.id === admin.id) return Response.json({ error: 'Cannot delete your own account' }, { status: 400 })

  await env.ddsr_dashboard.prepare('DELETE FROM user WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
