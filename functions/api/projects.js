export async function onRequestPost({ env, request }) {
  const body = await request.json()
  const { client_id, name, subtitle, slug, go_live_date, project_start_date } = body
  if (!client_id) return Response.json({ error: 'client_id is required' }, { status: 400 })
  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })
  if (!slug?.trim()) return Response.json({ error: 'slug is required' }, { status: 400 })

  const existing = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ?').bind(slug.trim()).first()
  if (existing) return Response.json({ error: 'Slug already in use' }, { status: 409 })

  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO projects (client_id, name, client_display_name, subtitle, slug, go_live_date, project_start_date, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(client_id, name.trim(), name.trim(), subtitle?.trim() || null, slug.trim(),
      go_live_date || null, project_start_date || null, now, now).run()

  await env.ddsr_dashboard.prepare(`
    INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active, created_at, updated_at)
    VALUES (?, 'Unassigned', null, null, '#F1F5F9', '#94A3B8', 1, ?, ?)
  `).bind(meta.last_row_id, now, now).run()

  const project = await env.ddsr_dashboard.prepare('SELECT * FROM projects WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(project, { status: 201 })
}
