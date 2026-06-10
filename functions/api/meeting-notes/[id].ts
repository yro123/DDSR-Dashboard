import { requireSession, requireProjectAccess, getMeetingProjectIdByTopic } from '../../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { MeetingNoteRow } from '../../../shared/types'

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  // Resolve project via topic for authorization
  const note = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_notes WHERE id = ?').bind(id).first<MeetingNoteRow>()
  if (!note) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByTopic(env, note.topic_id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  let note_text: string | null
  let sort_order: number | null
  try {
    const obj = await readJson(request)
    note_text = optString(obj, 'note_text')
    sort_order = optNumber(obj, 'sort_order')
  } catch (err) { return badRequestResponse(err) }

  await env.ddsr_dashboard.prepare(`
    UPDATE meeting_notes SET note_text = ?, sort_order = ? WHERE id = ?
  `).bind(note_text?.trim() || null, sort_order ?? 0, id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_notes WHERE id = ?').bind(id).first<MeetingNoteRow>()
  return Response.json(updated)
}

export async function onRequestDelete({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const note = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_notes WHERE id = ?').bind(id).first<MeetingNoteRow>()
  if (!note) return Response.json({ error: 'Not found' }, { status: 404 })

  const projectId = await getMeetingProjectIdByTopic(env, note.topic_id)
  if (!projectId) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId })
  if (access instanceof Response) return access

  await env.ddsr_dashboard.prepare('DELETE FROM meeting_notes WHERE id = ?').bind(id).run()
  return Response.json({ deleted: true })
}
