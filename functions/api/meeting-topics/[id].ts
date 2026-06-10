import { requireSession, requireProjectAccess, getMeetingProjectIdByTopic } from '../../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { MeetingTopicRow } from '../../../shared/types'

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const topic = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_topics WHERE id = ?').bind(id).first<MeetingTopicRow>()
  if (!topic) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByTopic(env, id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  let area: string | null
  let color: string | null
  let workflow_id: number | null
  let sort_order: number | null
  try {
    const obj = await readJson(request)
    area = optString(obj, 'area')
    color = optString(obj, 'color')
    workflow_id = optNumber(obj, 'workflow_id')
    sort_order = optNumber(obj, 'sort_order')
  } catch (err) { return badRequestResponse(err) }
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE meeting_topics SET area = ?, color = ?, workflow_id = ?, sort_order = ?, updated_at = ?
    WHERE id = ?
  `).bind(area?.trim() || null, color || null, workflow_id || null, sort_order ?? 0, now, id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_topics WHERE id = ?').bind(id).first<MeetingTopicRow>()
  return Response.json(updated)
}

export async function onRequestDelete({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const topic = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_topics WHERE id = ?').bind(id).first<MeetingTopicRow>()
  if (!topic) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByTopic(env, id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  await env.ddsr_dashboard.prepare('DELETE FROM meeting_topics WHERE id = ?').bind(id).run()
  return Response.json({ deleted: true })
}
