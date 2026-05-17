export async function onRequestPut({ env, params, request }) {
  const { note_text, sort_order } = await request.json()

  await env.ddsr_dashboard.prepare(`
    UPDATE meeting_notes SET note_text = ?, sort_order = ? WHERE id = ?
  `).bind(note_text?.trim() || null, sort_order ?? 0, params.id).run()

  const note = await env.ddsr_dashboard.prepare('SELECT * FROM meeting_notes WHERE id = ?').bind(params.id).first()
  if (!note) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(note)
}

export async function onRequestDelete({ env, params }) {
  await env.ddsr_dashboard.prepare('DELETE FROM meeting_notes WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
