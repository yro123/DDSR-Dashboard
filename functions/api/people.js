export async function onRequestPost({ env, request }) {
  const body = await request.json()
  let { project_id, slug, name, role, org_type, email, avatar_bg, avatar_fg } = body
  if (slug && !project_id) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first()
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 })
    project_id = proj.id
  }
  if (!project_id) return Response.json({ error: 'project_id or slug required' }, { status: 400 })
  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })

  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO people (project_id, name, role, org_type, email, avatar_bg, avatar_fg, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(project_id, name.trim(), role || null, org_type || null, email || null,
      avatar_bg || '#DBEAFE', avatar_fg || '#1E40AF', now, now).run()

  const person = await env.ddsr_dashboard.prepare('SELECT * FROM people WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(person, { status: 201 })
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  let projectId = url.searchParams.get('project_id') || 1;
  if (slug) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first();
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 });
    projectId = proj.id;
  }

  const { results } = await env.ddsr_dashboard.prepare(`
    SELECT * FROM people WHERE project_id = ? AND is_active = 1 ORDER BY name ASC
  `).bind(projectId).all();

  return Response.json(results);
}
