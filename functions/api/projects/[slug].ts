import { requireProjectAccess, requireAdmin } from '../../lib/authz'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { ProjectRow } from '../../../shared/types'

interface UpdateProjectBody {
  name?: string | null
  subtitle?: string | null
  go_live_date?: string | null
  project_start_date?: string | null
  project_end_date?: string | null
}

export async function onRequestGet({ env, params, request }: Ctx): Promise<Response> {
  const slug = routeParam(params, 'slug')
  // requireProjectAccess handles login + ownership check (admins bypass)
  const access = await requireProjectAccess(request, env, { slug })
  if (access instanceof Response) return access

  const project = await env.ddsr_dashboard.prepare(`
    SELECT id, name, client_display_name, subtitle, slug, go_live_date, project_start_date, project_end_date, is_active, client_id
    FROM projects WHERE slug = ?
  `).bind(slug).first<ProjectRow>()
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(project)
}

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const slug = routeParam(params, 'slug')
  // Only admins should mutate core project settings.
  const access = await requireProjectAccess(request, env, { slug })
  if (access instanceof Response) return access

  // BUGFIX (TS migration): the original JS passed the whole ProjectAccess wrapper
  // ({ session, projectInfo }) to requireAdmin, which reads `.user` — absent on the
  // wrapper — so isAdmin() was always false and PUT returned 403 for everyone
  // (project-settings save was broken). Pass the actual AuthSession.
  const adminCheck = requireAdmin(access.session)
  if (adminCheck) return adminCheck

  const { name, subtitle, go_live_date, project_start_date, project_end_date } = await request.json() as UpdateProjectBody
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE projects SET name = ?, subtitle = ?, go_live_date = ?, project_start_date = ?, project_end_date = ?, updated_at = ?
    WHERE slug = ?
  `).bind(name?.trim() || null, subtitle?.trim() || null, go_live_date || null,
      project_start_date || null, project_end_date || null, now, slug).run()

  const project = await env.ddsr_dashboard.prepare('SELECT * FROM projects WHERE slug = ?').bind(slug).first<ProjectRow>()
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(project)
}
