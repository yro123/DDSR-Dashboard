export async function onRequestPost({ env, request }) {
  const body = await request.json()
  const { topic_id, note_text, sort_order } = body
  if (!topic_id) return Response.json({ error: 'topic_id is required' }, { status: 400 })
  if (!note_text?.trim()) return Response.json({ error: 'note_text is required' }, { status: 400 })

  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO meeting_notes (topic_id, note_text, sort_order, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(topic_id, note_text.trim(), sort_order ?? 0, now).run()

  const note = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_notes WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(note, { status: 201 })
}
