import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../lib/authz.js'

export async function onRequestPost({ env, request }) {
  const body = await request.json()
  const { topic_id, action_text, assignee_name, assignee_id, sort_order } = body
  if (!topic_id) return Response.json({ error: 'topic_id is required' }, { status: 400 })
  if (!action_text?.trim()) return Response.json({ error: 'action_text is required' }, { status: 400 })

  // Resolve project from topic for authorization
  const topic = await env.ddsr_dashboard
    .prepare('SELECT mt.meeting_id FROM meeting_topics mt WHERE mt.id = ? LIMIT 1')
    .bind(topic_id)
    .first()

  if (!topic) return Response.json({ error: 'Topic not found' }, { status: 404 })

  const meeting = await env.ddsr_dashboard
    .prepare('SELECT project_id FROM meetings WHERE id = ? LIMIT 1')
    .bind(topic.meeting_id)
    .first()

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
    INSERT INTO meeting_action_items (topic_id, action_text, assignee_name, assignee_id, status, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'Open', ?, ?, ?)
  `).bind(topic_id, action_text.trim(), assignee_name || null, assignee_id || null, sort_order ?? 0, now, now).run()

  const item = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_action_items WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(item, { status: 201 })
}
