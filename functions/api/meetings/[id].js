export async function onRequestPut({ env, params, request }) {
  const body = await request.json()
  const { meeting_date, display_date, title, meeting_type, location, next_meeting, is_published } = body
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE meetings SET
      meeting_date = ?, display_date = ?, title = ?, meeting_type = ?,
      location = ?, next_meeting = ?, is_published = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    meeting_date, display_date || meeting_date, title?.trim() || null,
    meeting_type || null, location || null, next_meeting || null,
    is_published ?? 1, now, params.id
  ).run()

  const meeting = await env.ddsr_dashboard.prepare('SELECT * FROM meetings WHERE id = ?').bind(params.id).first()
  if (!meeting) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(meeting)
}

export async function onRequestDelete({ env, params }) {
  await env.ddsr_dashboard.prepare('DELETE FROM meetings WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
