import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { AuthSession, SessionUser, MeetingRow } from '../../../shared/types'

interface MeetingAccess {
  session: AuthSession
  user: SessionUser
}

async function authorizeMeetingAccess(
  request: Request,
  env: Ctx['env'],
  meeting: MeetingRow,
): Promise<MeetingAccess | Response> {
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

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const meeting = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(id).first<MeetingRow>()
  if (!meeting) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizeMeetingAccess(request, env, meeting)
  if (authResult instanceof Response) return authResult

  let project_id: number | null
  let meeting_date: string | null
  let display_date: string | null
  let title: string | null
  let meeting_type: string | null
  let location: string | null
  let next_meeting: string | null
  let is_published: number | null
  try {
    const obj = await readJson(request)
    project_id = optNumber(obj, 'project_id')
    meeting_date = optString(obj, 'meeting_date')
    display_date = optString(obj, 'display_date')
    title = optString(obj, 'title')
    meeting_type = optString(obj, 'meeting_type')
    location = optString(obj, 'location')
    next_meeting = optString(obj, 'next_meeting')
    is_published = optNumber(obj, 'is_published')
  } catch (err) { return badRequestResponse(err) }

  // Reassignment to another project is admin-only. The meeting's topics → notes →
  // action items follow via FK, so the whole tree moves with it.
  let nextProjectId = meeting.project_id
  if (project_id != null && project_id !== meeting.project_id) {
    if (!isAdmin(authResult.user)) {
      return Response.json({ error: 'Only admins can reassign meetings to another project' }, { status: 403 })
    }
    const target = await getProjectClient(env, { projectId: project_id })
    if (!target) return Response.json({ error: 'Target project not found' }, { status: 404 })
    nextProjectId = project_id
  }

  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE meetings SET
      project_id = ?, meeting_date = ?, display_date = ?, title = ?, meeting_type = ?,
      location = ?, next_meeting = ?, is_published = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    nextProjectId, meeting_date, display_date || meeting_date, title?.trim() || null,
    meeting_type || null, location || null, next_meeting || null,
    is_published ?? 1, now, id
  ).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(id).first<MeetingRow>()
  return Response.json(updated)
}

export async function onRequestDelete({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const meeting = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(id).first<MeetingRow>()
  if (!meeting) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizeMeetingAccess(request, env, meeting)
  if (authResult instanceof Response) return authResult

  await env.ddsr_dashboard.prepare('DELETE FROM meetings WHERE id = ?').bind(id).run()
  return Response.json({ deleted: true })
}
