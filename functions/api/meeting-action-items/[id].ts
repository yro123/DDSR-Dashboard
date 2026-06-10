import { requireSession, requireProjectAccess, getMeetingProjectIdByActionItem } from '../../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { MeetingActionItemRow } from '../../../shared/types'

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const item = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_action_items WHERE id = ?').bind(id).first<MeetingActionItemRow>()
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByActionItem(env, id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  let action_text: string | null
  let assignee_name: string | null
  let assignee_id: number | null
  let status: string | null
  try {
    const obj = await readJson(request)
    action_text = optString(obj, 'action_text')
    assignee_name = optString(obj, 'assignee_name')
    assignee_id = optNumber(obj, 'assignee_id')
    status = optString(obj, 'status')
  } catch (err) { return badRequestResponse(err) }
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE meeting_action_items SET action_text = ?, assignee_name = ?, assignee_id = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).bind(action_text?.trim() || null, assignee_name || null, assignee_id || null, status || 'Open', now, id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_action_items WHERE id = ?').bind(id).first<MeetingActionItemRow>()
  return Response.json(updated)
}

export async function onRequestDelete({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const item = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_action_items WHERE id = ?').bind(id).first<MeetingActionItemRow>()
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByActionItem(env, id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  await env.ddsr_dashboard.prepare('DELETE FROM meeting_action_items WHERE id = ?').bind(id).run()
  return Response.json({ deleted: true })
}
