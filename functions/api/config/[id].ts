import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../../lib/authz'
import { routeParam } from '../../lib/types'
import type { Ctx, Env } from '../../lib/types'
import type { AppConfigRow } from '../../../shared/types'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'

interface UpdateConfigBody {
  value?: string | null
  color?: string | null
  sort_order?: number | null
  is_active?: number | null
}

/**
 * Authorize a write to a config row.
 * - Global rows (project_id == null) are admin-only.
 * - Project rows require admin OR membership in the project's client.
 * Returns a Response (denial) or null (allowed).
 */
async function authorizeConfigWrite(
  request: Request,
  env: Env,
  projectId: number | null,
): Promise<Response | null> {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session
  const user = session.user

  if (isAdmin(user)) return null

  // Non-admins may only touch project-scoped rows for projects they can access.
  if (!projectId) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const info = await getProjectClient(env, { projectId })
  if (!info || !(await canAccessProject(user, info, env))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  let body: UpdateConfigBody
  try {
    const obj = await readJson(request)
    body = {
      value: optString(obj, 'value'),
      color: optString(obj, 'color'),
      sort_order: optNumber(obj, 'sort_order'),
      is_active: optNumber(obj, 'is_active'),
    }
  } catch (err) {
    return badRequestResponse(err)
  }
  const now = new Date().toISOString()

  const existing = await env.ddsr_dashboard.prepare(
    'SELECT * FROM app_config WHERE id = ?'
  ).bind(id).first<AppConfigRow>()
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const denied = await authorizeConfigWrite(request, env, existing.project_id)
  if (denied) return denied

  const newValue = body.value?.trim() || existing.value
  const newColor = body.color !== undefined ? (body.color || null) : existing.color

  await env.ddsr_dashboard.prepare(`
    UPDATE app_config SET value = ?, color = ?, sort_order = ?, is_active = ?, updated_at = ?
    WHERE id = ?
  `).bind(newValue, newColor, body.sort_order ?? existing.sort_order, body.is_active ?? existing.is_active, now, id).run()

  const item = await env.ddsr_dashboard.prepare(
    'SELECT * FROM app_config WHERE id = ?'
  ).bind(id).first<AppConfigRow>()
  return Response.json(item)
}

export async function onRequestDelete({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const item = await env.ddsr_dashboard.prepare(
    'SELECT * FROM app_config WHERE id = ?'
  ).bind(id).first<AppConfigRow>()
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })
  if (item.is_system) return Response.json({ error: 'Cannot delete system values' }, { status: 403 })

  const denied = await authorizeConfigWrite(request, env, item.project_id)
  if (denied) return denied

  await env.ddsr_dashboard.prepare('DELETE FROM app_config WHERE id = ?').bind(id).run()
  return Response.json({ deleted: true })
}
