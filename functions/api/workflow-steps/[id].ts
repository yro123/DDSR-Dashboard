import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { WorkflowStepRow } from '../../../shared/types'

interface StepDetail {
  id: number
  summary?: string | null
  [key: string]: unknown
}

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  let status: string | null, label: string | null, sort_order: number | null
  let summary: string | null | undefined
  let points: string[] | undefined
  try {
    const obj = await readJson(request)
    status = optString(obj, 'status')
    label = optString(obj, 'label')
    sort_order = optNumber(obj, 'sort_order')
    // Preserve the absent-vs-present distinction the details update gate relies on.
    summary = 'summary' in obj ? optString(obj, 'summary') : undefined
    points = Array.isArray(obj.points) ? obj.points as string[] : undefined
  } catch (err) {
    return badRequestResponse(err)
  }
  const now = new Date().toISOString()

  const step = await env.ddsr_dashboard.prepare('SELECT * FROM workflow_steps WHERE id = ?').bind(id).first<WorkflowStepRow>()
  if (!step) return Response.json({ error: 'Not found' }, { status: 404 })

  // Resolve project for authorization
  const workflow = await env.ddsr_dashboard.prepare('SELECT project_id FROM workflows WHERE id = ? LIMIT 1').bind(step.workflow_id).first<{ project_id: number }>()
  if (!workflow) return Response.json({ error: 'Workflow not found' }, { status: 404 })

  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const user = session.user
  if (!isAdmin(user)) {
    const info = await getProjectClient(env, { projectId: workflow.project_id })
    if (!info || !(await canAccessProject(user, info, env))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  await env.ddsr_dashboard.prepare(
    `UPDATE workflow_steps SET label = ?, status = ?, sort_order = COALESCE(?, sort_order), updated_at = ? WHERE id = ?`
  ).bind(label ?? step.label, status ?? step.status, sort_order ?? null, now, id).run()

  if (summary !== undefined || points !== undefined) {
    let detail = await env.ddsr_dashboard.prepare(
      'SELECT * FROM workflow_step_details WHERE workflow_step_id = ?'
    ).bind(id).first<StepDetail>()

    if (detail) {
      await env.ddsr_dashboard.prepare(
        `UPDATE workflow_step_details SET summary = ?, updated_at = ? WHERE id = ?`
      ).bind(summary ?? detail.summary, now, detail.id).run()
    } else {
      const { meta } = await env.ddsr_dashboard.prepare(
        `INSERT INTO workflow_step_details (workflow_step_id, summary, created_at, updated_at) VALUES (?, ?, ?, ?)`
      ).bind(id, summary ?? null, now, now).run()
      detail = { id: meta.last_row_id as number }
    }

    if (Array.isArray(points)) {
      await env.ddsr_dashboard.prepare(
        'DELETE FROM workflow_step_detail_points WHERE step_detail_id = ?'
      ).bind(detail.id).run()
      for (let i = 0; i < points.length; i++) {
        const pt = points[i].trim()
        if (pt) await env.ddsr_dashboard.prepare(
          `INSERT INTO workflow_step_detail_points (step_detail_id, point_text, sort_order) VALUES (?, ?, ?)`
        ).bind(detail.id, pt, i).run()
      }
    }
  }

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM workflow_steps WHERE id = ?').bind(id).first<WorkflowStepRow>()
  return Response.json(updated)
}
