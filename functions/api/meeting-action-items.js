export async function onRequestPost({ env, request }) {
  const body = await request.json()
  const { topic_id, action_text, assignee_name, assignee_id, sort_order } = body
  if (!topic_id) return Response.json({ error: 'topic_id is required' }, { status: 400 })
  if (!action_text?.trim()) return Response.json({ error: 'action_text is required' }, { status: 400 })

  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO meeting_action_items (topic_id, action_text, assignee_name, assignee_id, status, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'Open', ?, ?, ?)
  `).bind(topic_id, action_text.trim(), assignee_name || null, assignee_id || null, sort_order ?? 0, now, now).run()

  const item = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_action_items WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(item, { status: 201 })
}
