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
