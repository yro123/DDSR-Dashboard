import { requireSession, isAdmin, getProjectClient, canAccessProject } from '../../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { PersonRow, AuthSession, SessionUser } from '../../../shared/types'

async function authorizePersonAccess(
  request: Request,
  env: Ctx['env'],
  person: Pick<PersonRow, 'project_id'> | null,
): Promise<{ session: AuthSession; user: SessionUser } | Response> {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const user = session.user
  if (isAdmin(user)) return { session, user }

  if (!person?.project_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const info = await getProjectClient(env, { projectId: person.project_id })
  if (!info || !(await canAccessProject(user, info, env))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { session, user }
}

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const person = await env.ddsr_dashboard.prepare('SELECT * FROM people WHERE id = ?').bind(id).first<PersonRow>()
  if (!person) return Response.json({ error: 'Not found' }, { status: 404 })

  const authResult = await authorizePersonAccess(request, env, person)
  if (authResult instanceof Response) return authResult

  let name: string | null, role: string | null, org_type: string | null,
    email: string | null, avatar_bg: string | null, avatar_fg: string | null,
    is_active: number | null, user_id: string | null
  try {
    const obj = await readJson(request)
    name = optString(obj, 'name')
    role = optString(obj, 'role')
    org_type = optString(obj, 'org_type')
    email = optString(obj, 'email')
    avatar_bg = optString(obj, 'avatar_bg')
    avatar_fg = optString(obj, 'avatar_fg')
    is_active = optNumber(obj, 'is_active')
    user_id = optString(obj, 'user_id')
  } catch (err) {
    return badRequestResponse(err)
  }
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE people SET name = ?, role = ?, org_type = ?, email = ?, avatar_bg = ?, avatar_fg = ?, is_active = ?, user_id = ?, updated_at = ?
    WHERE id = ?
  `).bind(name || null, role || null, org_type || null, email || null,
      avatar_bg || null, avatar_fg || null, is_active ?? 1, user_id || null, now, id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM people WHERE id = ?').bind(id).first<PersonRow>()
  return Response.json(updated)
}
