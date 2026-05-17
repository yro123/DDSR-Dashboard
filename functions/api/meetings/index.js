export async function onRequestPost({ env, request }) {
  const body = await request.json()
  const { project_id, slug, meeting_date, display_date, title, meeting_type, location, next_meeting } = body

  let projectId = project_id
  if (slug && !projectId) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first()
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

  const meeting = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(meeting, { status: 201 })
}
