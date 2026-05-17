export async function onRequestPut({ env, params, request }) {
  const body = await request.json()
  const { area, color, workflow_id, sort_order } = body
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE meeting_topics SET area = ?, color = ?, workflow_id = ?, sort_order = ?, updated_at = ?
    WHERE id = ?
  `).bind(area?.trim() || null, color || null, workflow_id || null, sort_order ?? 0, now, params.id).run()

  const topic = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_topics WHERE id = ?').bind(params.id).first()
  if (!topic) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(topic)
}

export async function onRequestDelete({ env, params }) {
  await env.ddsr_dashboard.prepare('DELETE FROM meeting_topics WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
