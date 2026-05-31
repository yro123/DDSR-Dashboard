import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../../lib/authz.js'

export async function onRequestPut({ env, params, request }) {
  const { description, phase } = await request.json()

  // Find the project for this workflow
  const wf = await env.ddsr_dashboard.prepare('SELECT project_id FROM workflows WHERE id = ? LIMIT 1').bind(params.id).first()
  if (!wf) return Response.json({ error: 'Not found' }, { status: 404 })

  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const user = session.user
  if (!isAdmin(user)) {
    const info = await getProjectClient(env, { projectId: wf.project_id })
    if (!info || !(await canAccessProject(user, info, env))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(
    `UPDATE workflows SET description = ?, phase = ?, updated_at = ? WHERE id = ?`
  ).bind(description ?? null, phase ?? null, now, params.id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM workflows WHERE id = ?').bind(params.id).first()
  return Response.json(updated)
}
