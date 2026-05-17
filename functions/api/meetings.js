export async function onRequestPost({ env, request }) {
  const body = await request.json()
  let { project_id, slug, meeting_date, display_date, title, meeting_type, location, next_meeting } = body
  if (slug && !project_id) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first()
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 })
    project_id = proj.id
  }
  if (!project_id) return Response.json({ error: 'project_id or slug required' }, { status: 400 })
  if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 })
  if (!meeting_date) return Response.json({ error: 'meeting_date is required' }, { status: 400 })

  const autoSlug = meeting_date.replace(/-/g, '')
  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO meetings (project_id, slug, meeting_date, display_date, title, meeting_type, location, next_meeting, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(project_id, autoSlug, meeting_date, display_date || meeting_date, title.trim(),
      meeting_type || null, location || null, next_meeting || null, now, now).run()

  const meeting = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(meeting, { status: 201 })
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const showAll = url.searchParams.get('all') === '1';
  let projectId = url.searchParams.get('project_id') || 1;
  if (slug) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first();
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 });
    projectId = proj.id;
  }

  const publishedFilter = showAll ? '' : 'AND is_published = 1';
  const { results: meetings } = await env.ddsr_dashboard.prepare(`
    SELECT * FROM meetings WHERE project_id = ? ${publishedFilter} ORDER BY meeting_date DESC, id DESC
  `).bind(projectId).all();

  const { results: attendees } = await env.ddsr_dashboard.prepare(`
    SELECT ma.*, p.avatar_bg, p.avatar_fg
    FROM meeting_attendees ma
    LEFT JOIN people p ON ma.person_id = p.id
    WHERE ma.meeting_id IN (SELECT id FROM meetings WHERE project_id = ?)
    ORDER BY ma.meeting_id, ma.sort_order
  `).bind(projectId).all();

  const { results: topics } = await env.ddsr_dashboard.prepare(`
    SELECT * FROM meeting_topics
    WHERE meeting_id IN (SELECT id FROM meetings WHERE project_id = ?)
    ORDER BY meeting_id, sort_order
  `).bind(projectId).all();

  const { results: notes } = await env.ddsr_dashboard.prepare(`
    SELECT mn.* FROM meeting_notes mn
    JOIN meeting_topics mt ON mn.topic_id = mt.id
    JOIN meetings m ON mt.meeting_id = m.id
    WHERE m.project_id = ?
    ORDER BY mn.topic_id, mn.sort_order
  `).bind(projectId).all();

  const { results: actions } = await env.ddsr_dashboard.prepare(`
    SELECT mai.* FROM meeting_action_items mai
    JOIN meeting_topics mt ON mai.topic_id = mt.id
    JOIN meetings m ON mt.meeting_id = m.id
    WHERE m.project_id = ?
    ORDER BY mai.topic_id, mai.sort_order
  `).bind(projectId).all();

  const topicsWithContent = topics.map(t => ({
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
