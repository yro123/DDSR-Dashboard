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
