export async function onRequestPut({ env, params, request }) {
  const { name, display_name, slug, is_active } = await request.json()
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE clients SET name = ?, display_name = ?, slug = ?, is_active = ?, updated_at = ?
    WHERE id = ?
  `).bind(name?.trim() || null, display_name?.trim() || null, slug?.trim() || null,
      is_active ?? 1, now, params.id).run()

  const client = await env.ddsr_dashboard.prepare('SELECT * FROM clients WHERE id = ?').bind(params.id).first()
  if (!client) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(client)
}
