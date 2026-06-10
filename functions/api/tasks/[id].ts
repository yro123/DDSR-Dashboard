import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'
import { routeParam } from '../../lib/types'
import type { Ctx, Env } from '../../lib/types'
import type { AuthSession, SessionUser, TaskWithMeta } from '../../../shared/types'

const taskWithName = (env: Env, id: string) => env.ddsr_dashboard.prepare(`
  SELECT t.*, COALESCE(u.name, pe.name) AS assignee_name,
         w.short_name as workflow_name, w.color as workflow_color,
         t.project_id
  FROM tasks t
  LEFT JOIN workflows w ON t.workflow_id = w.id
  LEFT JOIN people pe ON pe.id = t.assignee_id
  LEFT JOIN "user" u ON u.id = pe.user_id
  WHERE t.id = ?
`).bind(id).first<TaskWithMeta>()

async function authorizeTaskAccess(
  request: Request,
  env: Env,
  task: TaskWithMeta | null,
): Promise<{ session: AuthSession; user: SessionUser } | Response> {
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

export async function onRequestGet({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const task = await taskWithName(env, id)
  if (!task) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizeTaskAccess(request, env, task)
  if (authResult instanceof Response) return authResult

  return Response.json(task)
}

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')

  let project_id: number | null
  let workflow_id: number | null
  let assignee_id: number | null
  let title: string | null
  let notes: string | null
  let status: string | null
  let priority: string | null
  let due_date: string | null
  let is_archived: number | boolean | null
  let user_feedback: string | null
  try {
    const body = await readJson(request)
    project_id = optNumber(body, 'project_id')
    workflow_id = optNumber(body, 'workflow_id')
    assignee_id = optNumber(body, 'assignee_id')
    title = optString(body, 'title')
    notes = optString(body, 'notes')
    status = optString(body, 'status')
    priority = optString(body, 'priority')
    due_date = optString(body, 'due_date')
    is_archived = (body.is_archived ?? null) as number | boolean | null
    user_feedback = optString(body, 'user_feedback')
  } catch (err) {
    return badRequestResponse(err)
  }

  const existing = await taskWithName(env, id)
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizeTaskAccess(request, env, existing)
  if (authResult instanceof Response) return authResult

  // Reassignment to another project is admin-only. People and workflows are
  // project-scoped, so a moved task's assignee/workflow would dangle — clear both.
  let nextProjectId = existing.project_id
  let nextWorkflowId = workflow_id ?? null
  let nextAssigneeId = assignee_id ?? null
  if (project_id != null && project_id !== existing.project_id) {
    if (!isAdmin(authResult.user)) {
      return Response.json({ error: 'Only admins can reassign tasks to another project' }, { status: 403 })
    }
    const target = await getProjectClient(env, { projectId: project_id })
    if (!target) return Response.json({ error: 'Target project not found' }, { status: 404 })
    nextProjectId = project_id
    nextWorkflowId = null
    nextAssigneeId = null
  }

  const now = new Date().toISOString()
  const archived_at = is_archived ? now : null

  await env.ddsr_dashboard.prepare(`
    UPDATE tasks SET
      project_id    = ?,
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
    nextProjectId, nextWorkflowId, nextAssigneeId,
    title, notes ?? null, status, priority ?? null, due_date ?? null,
    is_archived ? 1 : 0, archived_at,
    user_feedback ?? null,
    now, id
  ).run()

  const task = await taskWithName(env, id)
  return Response.json(task)
}

export async function onRequestDelete({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const existing = await taskWithName(env, id)
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizeTaskAccess(request, env, existing)
  if (authResult instanceof Response) return authResult

  await env.ddsr_dashboard.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run()
  return Response.json({ deleted: true })
}
