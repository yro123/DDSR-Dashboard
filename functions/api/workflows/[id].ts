import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../../lib/authz'
import { readJson, optString, badRequestResponse } from '../../lib/validate'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { WorkflowRow } from '../../../shared/types'

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  let description: string | null, phase: string | null
  try {
    const obj = await readJson(request)
    description = optString(obj, 'description')
    phase = optString(obj, 'phase')
  } catch (err) {
    return badRequestResponse(err)
  }

  // Find the project for this workflow
  const wf = await env.ddsr_dashboard.prepare('SELECT project_id FROM workflows WHERE id = ? LIMIT 1').bind(id).first<{ project_id: number }>()
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
  ).bind(description ?? null, phase ?? null, now, id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM workflows WHERE id = ?').bind(id).first<WorkflowRow>()
  return Response.json(updated)
}
