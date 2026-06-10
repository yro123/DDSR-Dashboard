import { requireSession, isAdmin, getProjectClient, canAccessProject, requireProjectAccess } from '../lib/authz'
import { parsePagination } from '../lib/pagination'
import { readJson, requireString, optString, optNumber, badRequestResponse } from '../lib/validate'
import type { Ctx } from '../lib/types'
import type { DocumentRow } from '../../shared/types'

export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  let projectId: number | string | null = url.searchParams.get('project_id')

  if (slug) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first<{ id: number }>()
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 })
    projectId = proj.id
  }

  if (!projectId) {
    return Response.json({ error: 'project_id or slug is required' }, { status: 400 })
  }

  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const user = session.user
  if (!isAdmin(user)) {
    const info = await getProjectClient(env, { projectId: Number(projectId) })
    if (!info || !(await canAccessProject(user, info, env))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  interface DocumentWithWorkflow extends DocumentRow {
    workflow_name: string | null
  }

  const { limit, offset } = parsePagination(url)
  const { results } = await env.ddsr_dashboard.prepare(`
    SELECT d.*, w.name as workflow_name FROM documents d
    LEFT JOIN workflows w ON d.workflow_id = w.id
    WHERE d.project_id = ? AND d.is_active = 1
    ORDER BY w.sort_order, d.id
    LIMIT ? OFFSET ?
  `).bind(projectId, limit, offset).all<DocumentWithWorkflow>()

  return Response.json(results)
}

export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  let slug: string | null
  let workflow_id: number | null
  let name: string
  let url: string | null
  let doc_type: string | null
  let bodyProjectId: number | null
  try {
    const body = await readJson(request)
    name = requireString(body, 'name')
    slug = optString(body, 'slug')
    workflow_id = optNumber(body, 'workflow_id')
    url = optString(body, 'url')
    doc_type = optString(body, 'doc_type')
    bodyProjectId = optNumber(body, 'project_id')
  } catch (err) {
    return badRequestResponse(err)
  }

  const access = await requireProjectAccess(request, env, { slug: slug ?? undefined, projectId: bodyProjectId ?? undefined })
  if (access instanceof Response) return access

  const project_id = access.projectInfo.projectId

  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(project_id, workflow_id || null, name, url || null, doc_type || null, now, now).run()

  const doc = await env.ddsr_dashboard.prepare('SELECT * FROM documents WHERE id = ?').bind(meta.last_row_id).first<DocumentRow>()
  return Response.json(doc, { status: 201 })
}
