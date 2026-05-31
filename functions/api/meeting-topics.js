import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../lib/authz.js'

export async function onRequestPost({ env, request }) {
  const body = await request.json()
  const { meeting_id, area, color, workflow_id, sort_order } = body
  if (!meeting_id) return Response.json({ error: 'meeting_id is required' }, { status: 400 })
  if (!area?.trim()) return Response.json({ error: 'area is required' }, { status: 400 })

  const meeting = await env.ddsr_dashboard.prepare('SELECT project_id FROM meetings WHERE id = ? LIMIT 1').bind(meeting_id).first()
  if (!meeting) return Response.json({ error: 'Meeting not found' }, { status: 404 })

  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const user = session.user
  if (!isAdmin(user)) {
    const info = await getProjectClient(env, { projectId: meeting.project_id })
    if (!info || !(await canAccessProject(user, info, env))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO meeting_topics (meeting_id, area, color, workflow_id, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(meeting_id, area.trim(), color || '#6366F1', workflow_id || null, sort_order ?? 0, now, now).run()

  const topic = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_topics WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(topic, { status: 201 })
}
