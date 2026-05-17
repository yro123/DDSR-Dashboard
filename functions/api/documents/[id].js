export async function onRequestPut({ env, params, request }) {
  const { workflow_id, name, url, doc_type } = await request.json()
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE documents SET workflow_id = ?, name = ?, url = ?, doc_type = ?, updated_at = ?
    WHERE id = ?
  `).bind(workflow_id || null, name?.trim() || null, url || null, doc_type || null, now, params.id).run()

  const doc = await env.ddsr_dashboard.prepare('SELECT * FROM documents WHERE id = ?').bind(params.id).first()
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(doc)
}

export async function onRequestDelete({ env, params }) {
  await env.ddsr_dashboard.prepare('UPDATE documents SET is_active = 0 WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
