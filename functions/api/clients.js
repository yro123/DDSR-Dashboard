export async function onRequestPost({ env, request }) {
  const { name, display_name, slug } = await request.json()
  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })
  if (!display_name?.trim()) return Response.json({ error: 'display_name is required' }, { status: 400 })
  if (!slug?.trim()) return Response.json({ error: 'slug is required' }, { status: 400 })

  const existing = await env.ddsr_dashboard.prepare('SELECT id FROM clients WHERE slug = ?').bind(slug.trim()).first()
  if (existing) return Response.json({ error: 'Slug already in use' }, { status: 409 })

  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO clients (name, display_name, slug, is_active, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?)
  `).bind(name.trim(), display_name.trim(), slug.trim(), now, now).run()

  const client = await env.ddsr_dashboard.prepare('SELECT * FROM clients WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(client, { status: 201 })
}

export async function onRequestGet({ env }) {
  const db = env.ddsr_dashboard

  const clients = await db.prepare(
    `SELECT id, slug, display_name, name, is_active FROM clients WHERE is_active = 1 ORDER BY name`
  ).all()

  const projects = await db.prepare(
    `SELECT id, slug, name, subtitle, client_id FROM projects WHERE is_active = 1 ORDER BY name`
  ).all()

  const result = clients.results.map(c => ({
    ...c,
    projects: projects.results.filter(p => p.client_id === c.id),
  }))

  return Response.json(result)
}
