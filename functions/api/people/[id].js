import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../../lib/authz.js'

async function authorizePersonAccess(request, env, person) {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const user = session.user
  if (isAdmin(user)) return { session, user }

  if (!person?.project_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const info = await getProjectClient(env, { projectId: person.project_id })
  if (!info || !(await canAccessProject(user, info, env))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { session, user }
}

export async function onRequestPut({ env, params, request }) {
  const person = await env.ddsr_dashboard.prepare('SELECT * FROM people WHERE id = ?').bind(params.id).first()
  if (!person) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizePersonAccess(request, env, person)
  if (authResult instanceof Response) return authResult

  const body = await request.json()
  const { name, role, org_type, email, avatar_bg, avatar_fg, is_active, user_id } = body
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE people SET name = ?, role = ?, org_type = ?, email = ?, avatar_bg = ?, avatar_fg = ?, is_active = ?, user_id = ?, updated_at = ?
    WHERE id = ?
  `).bind(name?.trim() || null, role || null, org_type || null, email || null,
      avatar_bg || null, avatar_fg || null, is_active ?? 1, user_id || null, now, params.id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM people WHERE id = ?').bind(params.id).first()
  return Response.json(updated)
}
