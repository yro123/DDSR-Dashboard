import { requireSession, isAdmin, getProjectClient, canAccessProject, requireProjectAccess } from '../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../lib/validate'
import { parsePagination } from '../lib/pagination'
import type { Ctx } from '../lib/types'
import type { MeetingRow, MeetingTopicRow, MeetingNoteRow, MeetingActionItemRow } from '../../shared/types'

/** meeting_attendees row joined with avatar fields from people. */
interface MeetingAttendeeRow {
  id: number
  meeting_id: number
  person_id: number | null
  attendee_name: string
  sort_order: number
  avatar_bg: string | null
  avatar_fg: string | null
}

interface TopicWithContent extends MeetingTopicRow {
  notes: MeetingNoteRow[]
  actionItems: MeetingActionItemRow[]
}

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

  if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 })
  if (!meeting_date) return Response.json({ error: 'meeting_date is required' }, { status: 400 })

  const autoSlug = meeting_date.replace(/-/g, '')
  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO meetings (project_id, slug, meeting_date, display_date, title, meeting_type, location, next_meeting, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(project_id, autoSlug, meeting_date, display_date || meeting_date, title.trim(),
      meeting_type || null, location || null, next_meeting || null, now, now).run()

  const meeting = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(meta.last_row_id).first<MeetingRow>()
  return Response.json(meeting, { status: 201 })
}

export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const showAll = url.searchParams.get('all') === '1';
  let projectId: number | string | null = url.searchParams.get('project_id');

  if (slug) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first<{ id: number }>();
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 });
    projectId = proj.id;
  }

  if (!projectId) {
    return Response.json({ error: 'project_id or slug is required' }, { status: 400 });
  }

  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const user = session.user;
  if (!isAdmin(user)) {
    const info = await getProjectClient(env, { projectId: Number(projectId) });
    if (!info || !(await canAccessProject(user, info, env))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const publishedFilter = showAll ? '' : 'AND is_published = 1';
  const { limit, offset } = parsePagination(url);
  const { results: meetings } = await env.ddsr_dashboard.prepare(`
    SELECT * FROM meetings WHERE project_id = ? ${publishedFilter} ORDER BY meeting_date DESC, id DESC LIMIT ? OFFSET ?
  `).bind(projectId, limit, offset).all<MeetingRow>();

  const { results: attendees } = await env.ddsr_dashboard.prepare(`
    SELECT ma.*, p.avatar_bg, p.avatar_fg
    FROM meeting_attendees ma
    LEFT JOIN people p ON ma.person_id = p.id
    WHERE ma.meeting_id IN (SELECT id FROM meetings WHERE project_id = ?)
    ORDER BY ma.meeting_id, ma.sort_order
  `).bind(projectId).all<MeetingAttendeeRow>();

  const { results: topics } = await env.ddsr_dashboard.prepare(`
    SELECT * FROM meeting_topics
    WHERE meeting_id IN (SELECT id FROM meetings WHERE project_id = ?)
    ORDER BY meeting_id, sort_order
  `).bind(projectId).all<MeetingTopicRow>();

  const { results: notes } = await env.ddsr_dashboard.prepare(`
    SELECT mn.* FROM meeting_notes mn
    JOIN meeting_topics mt ON mn.topic_id = mt.id
    JOIN meetings m ON mt.meeting_id = m.id
    WHERE m.project_id = ?
    ORDER BY mn.topic_id, mn.sort_order
  `).bind(projectId).all<MeetingNoteRow>();

  const { results: actions } = await env.ddsr_dashboard.prepare(`
    SELECT mai.* FROM meeting_action_items mai
    JOIN meeting_topics mt ON mai.topic_id = mt.id
    JOIN meetings m ON mt.meeting_id = m.id
    WHERE m.project_id = ?
    ORDER BY mai.topic_id, mai.sort_order
  `).bind(projectId).all<MeetingActionItemRow>();

  const topicsWithContent: TopicWithContent[] = topics.map(t => ({
    ...t,
    notes:       notes.filter(n => n.topic_id === t.id),
    actionItems: actions.filter(a => a.topic_id === t.id),
  }));

  const data = meetings.map(m => ({
    ...m,
    attendees: attendees.filter(a => a.meeting_id === m.id).map(a => a.attendee_name),
    topics:    topicsWithContent.filter(t => t.meeting_id === m.id),
  }));

  return Response.json(data);
}
