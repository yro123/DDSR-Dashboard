export async function onRequestGet({ env, request }) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  let projectId = url.searchParams.get('project_id') || 1
  if (slug) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first()
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 })
    projectId = proj.id
  }

  const { results } = await env.ddsr_dashboard.prepare(`
    SELECT d.*, w.name as workflow_name FROM documents d
    LEFT JOIN workflows w ON d.workflow_id = w.id
    WHERE d.project_id = ? AND d.is_active = 1
    ORDER BY w.sort_order, d.id
  `).bind(projectId).all()

  return Response.json(results)
}

export async function onRequestPost({ env, request }) {
  const body = await request.json()
  let { project_id, slug, workflow_id, name, url, doc_type } = body
  if (slug && !project_id) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first()
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 })
    project_id = proj.id
  }
  if (!project_id) return Response.json({ error: 'project_id or slug required' }, { status: 400 })
  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })

  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(project_id, workflow_id || null, name.trim(), url || null, doc_type || null, now, now).run()

  const doc = await env.ddsr_dashboard.prepare('SELECT * FROM documents WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(doc, { status: 201 })
}
