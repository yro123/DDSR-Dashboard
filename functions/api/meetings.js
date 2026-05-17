export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  let projectId = url.searchParams.get('project_id') || 1;
  if (slug) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first();
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 });
    projectId = proj.id;
  }

  const { results: meetings } = await env.ddsr_dashboard.prepare(`
    SELECT * FROM meetings WHERE project_id = ? AND is_published = 1 ORDER BY meeting_date DESC, id DESC
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
    notes:       notes.filter(n => n.topic_id === t.id).map(n => n.note_text),
    actionItems: actions.filter(a => a.topic_id === t.id),
  }));

  const data = meetings.map(m => ({
    ...m,
    attendees: attendees.filter(a => a.meeting_id === m.id).map(a => a.attendee_name),
    topics:    topicsWithContent.filter(t => t.meeting_id === m.id),
  }));

  return Response.json(data);
}
