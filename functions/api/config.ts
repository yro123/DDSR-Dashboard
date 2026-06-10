import {
  requireSession,
  isAdmin,
  requireProjectAccess,
  getProjectClient,
  canAccessProject,
  requireAdminUser,
} from '../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../lib/validate'
import type { Ctx } from '../lib/types'
import type { AppConfigRow } from '../../shared/types'

const CATEGORIES = ['task_status', 'task_priority', 'org_type', 'doc_type', 'action_status', 'topic_color']

export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  const globalOnly = url.searchParams.get('global') === '1'

  let projectId: number | null = null
  if (slug && !globalOnly) {
    const access = await requireProjectAccess(request, env, { slug })
    if (access instanceof Response) return access
    projectId = access.projectInfo.projectId
  }

  const { results: globalItems } = await env.ddsr_dashboard.prepare(
    `SELECT * FROM app_config WHERE project_id IS NULL ORDER BY category, sort_order`
  ).all<AppConfigRow>()

  let projectItems: AppConfigRow[] = []
  if (projectId) {
    const r = await env.ddsr_dashboard.prepare(
      `SELECT * FROM app_config WHERE project_id = ? ORDER BY category, sort_order`
    ).bind(projectId).all<AppConfigRow>()
    projectItems = r.results
  }

  const merged: Record<string, AppConfigRow[]> = {}
  const isOverride: Record<string, boolean> = {}
  for (const cat of CATEGORIES) {
    const projRows = projectItems.filter(r => r.category === cat)
    if (projRows.length > 0) {
      merged[cat] = projRows
      isOverride[cat] = true
    } else {
      merged[cat] = globalItems.filter(r => r.category === cat)
      isOverride[cat] = false
    }
  }

  // Also expose all global items for the ConfigTab UI
  const globalByCategory: Record<string, AppConfigRow[]> = {}
  for (const cat of CATEGORIES) {
    globalByCategory[cat] = globalItems.filter(r => r.category === cat)
  }

  return Response.json({
    ...merged,
    is_project_override: isOverride,
    global: globalByCategory,
    project_id: projectId,
  })
}

export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  let project_id: number | null
  let category: string | null
  let value: string | null
  let color: string | null
  let sort_order: number | null
  try {
    const body = await readJson(request)
    project_id = optNumber(body, 'project_id')
    category = optString(body, 'category')
    value = optString(body, 'value')
    color = optString(body, 'color')
    sort_order = optNumber(body, 'sort_order')
  } catch (err) {
    return badRequestResponse(err)
  }

  if (!category || !CATEGORIES.includes(category)) return Response.json({ error: 'Invalid category' }, { status: 400 })
  if (!value?.trim() && category !== 'topic_color') return Response.json({ error: 'value is required' }, { status: 400 })
  if (category === 'topic_color' && !color && !value) return Response.json({ error: 'color is required for topic_color' }, { status: 400 })

  if (project_id) {
    const session = await requireSession(request, env)
    if (session instanceof Response) return session

    const user = session.user
    if (!isAdmin(user)) {
      const info = await getProjectClient(env, { projectId: project_id })
      if (!info || !(await canAccessProject(user, info, env))) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  } else {
    // Global config changes are admin-only
    const admin = await requireAdminUser(request, env)
    if (admin instanceof Response) return admin
  }

  const now = new Date().toISOString()
  const insertValue = category === 'topic_color' ? (color || value) : value!.trim()
  const insertColor = category === 'topic_color' ? (color || value) : (color || null)

  try {
    const { meta } = await env.ddsr_dashboard.prepare(`
      INSERT INTO app_config (project_id, category, value, color, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(project_id || null, category, insertValue, insertColor, sort_order ?? 0, now, now).run()

    const item = await env.ddsr_dashboard.prepare(
      'SELECT * FROM app_config WHERE id = ?'
    ).bind(meta.last_row_id).first<AppConfigRow>()
    return Response.json(item, { status: 201 })
  } catch (e) {
    if ((e as Error).message?.includes('UNIQUE')) return Response.json({ error: 'Value already exists' }, { status: 409 })
    throw e
  }
}
