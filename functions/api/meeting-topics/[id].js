import { requireSession, requireProjectAccess, getMeetingProjectIdByTopic } from '../../lib/authz.js'

export async function onRequestPut({ env, params, request }) {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const topic = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_topics WHERE id = ?').bind(params.id).first()
  if (!topic) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByTopic(env, params.id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  const body = await request.json()
  const { area, color, workflow_id, sort_order } = body
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE meeting_topics SET area = ?, color = ?, workflow_id = ?, sort_order = ?, updated_at = ?
    WHERE id = ?
  `).bind(area?.trim() || null, color || null, workflow_id || null, sort_order ?? 0, now, params.id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_topics WHERE id = ?').bind(params.id).first()
  return Response.json(updated)
}

export async function onRequestDelete({ env, params, request }) {
  const topic = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_topics WHERE id = ?').bind(params.id).first()
  if (!topic) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByTopic(env, params.id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  await env.ddsr_dashboard.prepare('DELETE FROM meeting_topics WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
