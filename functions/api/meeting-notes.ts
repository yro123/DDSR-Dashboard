import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../lib/authz'
import { readJson, requireString, requireNumber, optNumber, badRequestResponse } from '../lib/validate'
import type { Ctx } from '../lib/types'
import type { MeetingNoteRow } from '../../shared/types'

export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  let topic_id: number
  let note_text: string
  let sort_order: number | null
  try {
    const obj = await readJson(request)
    topic_id = requireNumber(obj, 'topic_id')
    note_text = requireString(obj, 'note_text')
    sort_order = optNumber(obj, 'sort_order')
  } catch (err) { return badRequestResponse(err) }

  // Resolve project from topic for authorization
  const topic = await env.ddsr_dashboard
    .prepare('SELECT mt.meeting_id FROM meeting_topics mt WHERE mt.id = ? LIMIT 1')
    .bind(topic_id)
    .first<{ meeting_id: number }>()

  if (!topic) return Response.json({ error: 'Topic not found' }, { status: 404 })

  const meeting = await env.ddsr_dashboard
    .prepare('SELECT project_id FROM meetings WHERE id = ? LIMIT 1')
    .bind(topic.meeting_id)
    .first<{ project_id: number }>()

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

  const note = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_notes WHERE id = ?').bind(meta.last_row_id).first<MeetingNoteRow>()
  return Response.json(note, { status: 201 })
}
