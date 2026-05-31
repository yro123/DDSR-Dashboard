import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../../lib/authz.js'

async function authorizeMeetingAccess(request, env, meeting) {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const user = session.user
  if (isAdmin(user)) return { session, user }

  if (!meeting?.project_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const info = await getProjectClient(env, { projectId: meeting.project_id })
  if (!info || !(await canAccessProject(user, info, env))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { session, user }
}

export async function onRequestPut({ env, params, request }) {
  const meeting = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(params.id).first()
  if (!meeting) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizeMeetingAccess(request, env, meeting)
  if (authResult instanceof Response) return authResult

  const body = await request.json()
  const { meeting_date, display_date, title, meeting_type, location, next_meeting, is_published } = body
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE meetings SET
      meeting_date = ?, display_date = ?, title = ?, meeting_type = ?,
      location = ?, next_meeting = ?, is_published = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    meeting_date, display_date || meeting_date, title?.trim() || null,
    meeting_type || null, location || null, next_meeting || null,
    is_published ?? 1, now, params.id
  ).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(params.id).first()
  return Response.json(updated)
}

export async function onRequestDelete({ env, params, request }) {
  const meeting = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(params.id).first()
  if (!meeting) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizeMeetingAccess(request, env, meeting)
  if (authResult instanceof Response) return authResult

  await env.ddsr_dashboard.prepare('DELETE FROM meetings WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
