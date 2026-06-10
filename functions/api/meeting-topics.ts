import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../lib/authz'
import { readJson, requireString, requireNumber, optString, optNumber, badRequestResponse } from '../lib/validate'
import type { Ctx } from '../lib/types'
import type { MeetingTopicRow } from '../../shared/types'

export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  let meeting_id: number
  let area: string
  let color: string | null
  let workflow_id: number | null
  let sort_order: number | null
  try {
    const obj = await readJson(request)
    meeting_id = requireNumber(obj, 'meeting_id')
    area = requireString(obj, 'area')
    color = optString(obj, 'color')
    workflow_id = optNumber(obj, 'workflow_id')
    sort_order = optNumber(obj, 'sort_order')
  } catch (err) { return badRequestResponse(err) }

  const meeting = await env.ddsr_dashboard.prepare('SELECT project_id FROM meetings WHERE id = ? LIMIT 1').bind(meeting_id).first<{ project_id: number }>()
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

  const topic = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_topics WHERE id = ?').bind(meta.last_row_id).first<MeetingTopicRow>()
  return Response.json(topic, { status: 201 })
}
