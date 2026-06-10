import { requireSession, isAdmin, getProjectClient, canAccessProject, requireAdminUser } from '../lib/authz'
import { readJson, requireString, optString, optNumber, badRequestResponse } from '../lib/validate'
import { parsePagination } from '../lib/pagination'
import type { Ctx } from '../lib/types'
import type { PersonRow } from '../../shared/types'

export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  let project_id: number | null, slug: string | null, name: string,
    role: string | null, org_type: string | null, email: string | null,
    avatar_bg: string | null, avatar_fg: string | null
  try {
    const obj = await readJson(request)
    project_id = optNumber(obj, 'project_id')
    slug = optString(obj, 'slug')
    name = requireString(obj, 'name')
    role = optString(obj, 'role')
    org_type = optString(obj, 'org_type')
    email = optString(obj, 'email')
    avatar_bg = optString(obj, 'avatar_bg')
    avatar_fg = optString(obj, 'avatar_fg')
  } catch (err) {
    return badRequestResponse(err)
  }
  if (slug && !project_id) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first<{ id: number }>()
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 })
    project_id = proj.id
  }
  if (!project_id) return Response.json({ error: 'project_id or slug required' }, { status: 400 })

  /**
   * IMPORTANT (clean architecture):
   * `people` records are lightweight directory / assignment entities.
   * They represent humans who can be assigned tasks, be meeting attendees, etc.
   *
   * They do NOT grant any dashboard access by themselves.
   * Real login + data access only comes from `user` + `user_clients` membership.
   *
   * `user_id` on a person is an optional enrichment link (for display purposes only).
   * It should only be set when a real authenticated user claims / matches this person.
   */
  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO people (project_id, name, role, org_type, email, avatar_bg, avatar_fg, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(project_id, name, role || null, org_type || null, email || null,
      avatar_bg || '#DBEAFE', avatar_fg || '#1E40AF', now, now).run()

  const person = await env.ddsr_dashboard.prepare('SELECT * FROM people WHERE id = ?').bind(meta.last_row_id).first<PersonRow>()
  return Response.json(person, { status: 201 })
}

interface PersonWithAccount extends PersonRow {
  user_account_id: string | null
  user_name: string | null
  user_email: string | null
}

export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const url = new URL(request.url)
  const { limit, offset } = parsePagination(url)
  const slug = url.searchParams.get('slug')
  let projectId: number | string | null = url.searchParams.get('project_id')

  if (slug) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first<{ id: number }>()
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 })
    projectId = proj.id
  }

  if (!projectId) {
    // For list endpoints, require explicit scoping
    return Response.json({ error: 'project_id or slug is required' }, { status: 400 })
  }

  // Basic access check for non-admins using the membership model
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const user = session.user
  if (!isAdmin(user)) {
    const info = await getProjectClient(env, { projectId: Number(projectId) })
    if (!info || !(await canAccessProject(user, info, env))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { results } = await env.ddsr_dashboard.prepare(`
    SELECT
      p.*,
      u.id as user_account_id,
      u.name as user_name,
      u.email as user_email
    FROM people p
    LEFT JOIN "user" u ON u.id = p.user_id
    WHERE p.project_id = ? AND p.is_active = 1
    ORDER BY p.name ASC
    LIMIT ? OFFSET ?
  `).bind(projectId, limit, offset).all<PersonWithAccount>()

  // Normalize the response for frontend convenience
  const enriched = results.map(row => ({
    ...row,
    has_account: !!row.user_account_id,
    account: row.user_account_id ? {
      id: row.user_account_id,
      name: row.user_name,
      email: row.user_email
    } : null
  }))

  return Response.json(enriched)
}
