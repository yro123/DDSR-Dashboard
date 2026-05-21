export async function onRequestPut({ env, params, request }) {
  const { value, color, sort_order, is_active } = await request.json()
  const now = new Date().toISOString()

  const existing = await env.ddsr_dashboard.prepare(
    'SELECT * FROM app_config WHERE id = ?'
  ).bind(params.id).first()
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const newValue = value?.trim() || existing.value
  const newColor = color !== undefined ? (color || null) : existing.color

  await env.ddsr_dashboard.prepare(`
    UPDATE app_config SET value = ?, color = ?, sort_order = ?, is_active = ?, updated_at = ?
    WHERE id = ?
  `).bind(newValue, newColor, sort_order ?? existing.sort_order, is_active ?? existing.is_active, now, params.id).run()

  const item = await env.ddsr_dashboard.prepare(
    'SELECT * FROM app_config WHERE id = ?'
  ).bind(params.id).first()
  return Response.json(item)
}

export async function onRequestDelete({ env, params }) {
  const item = await env.ddsr_dashboard.prepare(
    'SELECT * FROM app_config WHERE id = ?'
  ).bind(params.id).first()
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })
  if (item.is_system) return Response.json({ error: 'Cannot delete system values' }, { status: 403 })

  await env.ddsr_dashboard.prepare('DELETE FROM app_config WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
