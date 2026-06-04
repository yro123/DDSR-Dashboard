import { requireSession, isAdmin } from '../../lib/authz.js'

export async function onRequestPut({ env, params, request }) {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  if (!isAdmin(session.user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, display_name, slug, is_active, email_domain } = await request.json()
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE clients SET name = ?, display_name = ?, slug = ?, is_active = ?, email_domain = ?, updated_at = ?
    WHERE id = ?
  `).bind(name?.trim() || null, display_name?.trim() || null, slug?.trim() || null,
      is_active ?? 1, email_domain?.trim().toLowerCase() || null, now, params.id).run()

  const client = await env.ddsr_dashboard.prepare('SELECT * FROM clients WHERE id = ?').bind(params.id).first()
  if (!client) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(client)
}
