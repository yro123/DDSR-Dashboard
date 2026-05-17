export async function onRequestGet({ env, params }) {
  const project = await env.ddsr_dashboard.prepare(`
    SELECT id, name, client_display_name, subtitle, slug, go_live_date, project_start_date, project_end_date, is_active, client_id
    FROM projects WHERE slug = ?
  `).bind(params.slug).first()
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(project)
}

export async function onRequestPut({ env, params, request }) {
  const { name, subtitle, go_live_date, project_start_date, project_end_date } = await request.json()
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE projects SET name = ?, subtitle = ?, go_live_date = ?, project_start_date = ?, project_end_date = ?, updated_at = ?
    WHERE slug = ?
  `).bind(name?.trim() || null, subtitle?.trim() || null, go_live_date || null,
      project_start_date || null, project_end_date || null, now, params.slug).run()

  const project = await env.ddsr_dashboard.prepare('SELECT * FROM projects WHERE slug = ?').bind(params.slug).first()
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(project)
}
