export async function onRequestPut({ env, params, request }) {
  const body = await request.json()
  const { name, role, org_type, email, avatar_bg, avatar_fg, is_active, user_id } = body
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE people SET name = ?, role = ?, org_type = ?, email = ?, avatar_bg = ?, avatar_fg = ?, is_active = ?, user_id = ?, updated_at = ?
    WHERE id = ?
  `).bind(name?.trim() || null, role || null, org_type || null, email || null,
      avatar_bg || null, avatar_fg || null, is_active ?? 1, user_id || null, now, params.id).run()

  const person = await env.ddsr_dashboard.prepare('SELECT * FROM people WHERE id = ?').bind(params.id).first()
  if (!person) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(person)
}
