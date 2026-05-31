import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../../lib/authz.js'

const taskWithName = (env, id) => env.ddsr_dashboard.prepare(`
  SELECT t.*, COALESCE(u.name, pe.name) AS assignee_name,
         w.short_name as workflow_name, w.color as workflow_color,
         t.project_id
  FROM tasks t
  LEFT JOIN workflows w ON t.workflow_id = w.id
  LEFT JOIN people pe ON pe.id = t.assignee_id
  LEFT JOIN "user" u ON u.id = pe.user_id
  WHERE t.id = ?
`).bind(id).first()

async function authorizeTaskAccess(request, env, task) {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const user = session.user
  if (isAdmin(user)) return { session, user }

  if (!task?.project_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const info = await getProjectClient(env, { projectId: task.project_id })
  if (!info || !(await canAccessProject(user, info, env))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { session, user }
}

export async function onRequestGet({ env, params, request }) {
  const task = await taskWithName(env, params.id)
  if (!task) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizeTaskAccess(request, env, task)
  if (authResult instanceof Response) return authResult

  return Response.json(task)
}

export async function onRequestPut({ env, params, request }) {
  const body = await request.json()
  const { workflow_id, assignee_id, title, notes, status, priority, due_date, is_archived, user_feedback } = body

  const existing = await taskWithName(env, params.id)
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizeTaskAccess(request, env, existing)
  if (authResult instanceof Response) return authResult

  const now = new Date().toISOString()
  const archived_at = is_archived ? now : null

  await env.ddsr_dashboard.prepare(`
    UPDATE tasks SET
      workflow_id   = ?,
      assignee_id   = ?,
      title         = ?,
      notes         = ?,
      status        = ?,
      priority      = ?,
      due_date      = ?,
      is_archived   = ?,
      archived_at   = ?,
      user_feedback = ?,
      updated_at    = ?
    WHERE id = ?
  `).bind(
    workflow_id ?? null, assignee_id ?? null,
    title, notes ?? null, status, priority ?? null, due_date ?? null,
    is_archived ? 1 : 0, archived_at,
    user_feedback ?? null,
    now, params.id
  ).run()

  const task = await taskWithName(env, params.id)
  return Response.json(task)
}

export async function onRequestDelete({ env, params, request }) {
  const existing = await taskWithName(env, params.id)
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizeTaskAccess(request, env, existing)
  if (authResult instanceof Response) return authResult

  await env.ddsr_dashboard.prepare('DELETE FROM tasks WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
