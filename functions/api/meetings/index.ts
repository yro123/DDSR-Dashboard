import { requireProjectAccess } from '../../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'
import type { Ctx } from '../../lib/types'
import type { MeetingRow } from '../../../shared/types'

export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  let project_id: number | null
  let slug: string | null
  let meeting_date: string | null
  let display_date: string | null
  let title: string | null
  let meeting_type: string | null
  let location: string | null
  let next_meeting: string | null
  try {
    const obj = await readJson(request)
    project_id = optNumber(obj, 'project_id')
    slug = optString(obj, 'slug')
    meeting_date = optString(obj, 'meeting_date')
    display_date = optString(obj, 'display_date')
    title = optString(obj, 'title')
    meeting_type = optString(obj, 'meeting_type')
    location = optString(obj, 'location')
    next_meeting = optString(obj, 'next_meeting')
  } catch (err) { return badRequestResponse(err) }

  const access = await requireProjectAccess(request, env, { slug: slug ?? undefined, projectId: project_id ?? undefined })
  if (access instanceof Response) return access

  project_id = access.projectInfo.projectId

  let projectId: number | undefined = project_id ?? undefined
  if (slug && !projectId) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first<{ id: number }>()
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 })
    projectId = proj.id
  }
  if (!projectId) return Response.json({ error: 'project_id or slug required' }, { status: 400 })
  if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 })
  if (!meeting_date) return Response.json({ error: 'meeting_date is required' }, { status: 400 })

  const meetingSlug = slug || meeting_date.replace(/-/g, '')
  const now = new Date().toISOString()

  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO meetings (project_id, slug, meeting_date, display_date, title, meeting_type, location, next_meeting, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(projectId, meetingSlug, meeting_date, display_date || meeting_date, title.trim(),
      meeting_type || null, location || null, next_meeting || null, now, now).run()

  const meeting = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(meta.last_row_id).first<MeetingRow>()
  return Response.json(meeting, { status: 201 })
}
