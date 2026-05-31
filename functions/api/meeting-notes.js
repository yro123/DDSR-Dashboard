import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../lib/authz.js'

export async function onRequestPost({ env, request }) {
  const body = await request.json()
  const { topic_id, note_text, sort_order } = body
  if (!topic_id) return Response.json({ error: 'topic_id is required' }, { status: 400 })
  if (!note_text?.trim()) return Response.json({ error: 'note_text is required' }, { status: 400 })

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
    INSERT INTO meeting_notes (topic_id, note_text, sort_order, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(topic_id, note_text.trim(), sort_order ?? 0, now).run()

  const note = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_notes WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(note, { status: 201 })
}
