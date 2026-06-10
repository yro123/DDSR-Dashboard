import { requireAdminUser } from '../lib/authz'
import { isValidSlug, slugTaken } from '../lib/slug'
import { readJson, requireString, requireNumber, optString, badRequestResponse } from '../lib/validate'
import type { Ctx } from '../lib/types'
import type { ProjectRow } from '../../shared/types'

export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  let client_id: number, name: string, slug: string
  let subtitle: string | null, go_live_date: string | null, project_start_date: string | null
  try {
    const body = await readJson(request)
    client_id = requireNumber(body, 'client_id')
    name = requireString(body, 'name')
    slug = requireString(body, 'slug')
    subtitle = optString(body, 'subtitle')
    go_live_date = optString(body, 'go_live_date')
    project_start_date = optString(body, 'project_start_date')
  } catch (err) {
    return badRequestResponse(err)
  }

  const cleanSlug = slug.trim()
  if (!isValidSlug(cleanSlug)) {
    return Response.json({ error: 'Slug must be lowercase letters, numbers, and single hyphens' }, { status: 400 })
  }
  // Slugs share a URL namespace with clients, so enforce global uniqueness.
  if (await slugTaken(env, cleanSlug)) return Response.json({ error: 'Slug already in use' }, { status: 409 })

  const now = new Date().toISOString()

  // Project + default "Unassigned" person created atomically. The second insert
  // resolves the new project id via the (unique) slug, since D1 batch statements
  // can't reference an earlier statement's last_row_id directly.
  await env.ddsr_dashboard.batch([
    env.ddsr_dashboard.prepare(`
      INSERT INTO projects (client_id, name, client_display_name, subtitle, slug, go_live_date, project_start_date, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(client_id, name.trim(), name.trim(), subtitle?.trim() || null, cleanSlug,
        go_live_date || null, project_start_date || null, now, now),
    env.ddsr_dashboard.prepare(`
      INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active, created_at, updated_at)
      VALUES ((SELECT id FROM projects WHERE slug = ?), 'Unassigned', null, null, '#F1F5F9', '#94A3B8', 1, ?, ?)
    `).bind(cleanSlug, now, now),
  ])

  const project = await env.ddsr_dashboard.prepare('SELECT * FROM projects WHERE slug = ?').bind(cleanSlug).first<ProjectRow>()
  return Response.json(project, { status: 201 })
}
