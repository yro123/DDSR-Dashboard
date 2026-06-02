import { requireSession, requireProjectAccess, getMeetingProjectIdByTopic } from '../../lib/authz.js'

export async function onRequestPut({ env, params, request }) {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  // Resolve project via topic for authorization
  const note = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_notes WHERE id = ?').bind(params.id).first()
  if (!note) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByTopic(env, note.topic_id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  const { note_text, sort_order } = await request.json()

  await env.ddsr_dashboard.prepare(`
    UPDATE meeting_notes SET note_text = ?, sort_order = ? WHERE id = ?
  `).bind(note_text?.trim() || null, sort_order ?? 0, params.id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_notes WHERE id = ?').bind(params.id).first()
  return Response.json(updated)
}

export async function onRequestDelete({ env, params, request }) {
  const note = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_notes WHERE id = ?').bind(params.id).first()
  if (!note) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByTopic(env, note.topic_id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  await env.ddsr_dashboard.prepare('DELETE FROM meeting_notes WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
