import { requireSession, requireProjectAccess, getMeetingProjectIdByActionItem } from '../../lib/authz.js'

export async function onRequestPut({ env, params, request }) {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const item = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_action_items WHERE id = ?').bind(params.id).first()
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByActionItem(env, params.id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  const { action_text, assignee_name, assignee_id, status } = await request.json()
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE meeting_action_items SET action_text = ?, assignee_name = ?, assignee_id = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).bind(action_text?.trim() || null, assignee_name || null, assignee_id || null, status || 'Open', now, params.id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_action_items WHERE id = ?').bind(params.id).first()
  return Response.json(updated)
}

export async function onRequestDelete({ env, params, request }) {
  const item = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_action_items WHERE id = ?').bind(params.id).first()
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByActionItem(env, params.id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  await env.ddsr_dashboard.prepare('DELETE FROM meeting_action_items WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
