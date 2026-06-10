import { requireProjectAccess } from '../lib/authz'
import { parsePagination } from '../lib/pagination'
import { readJson, requireString, optString, optNumber, badRequestResponse } from '../lib/validate'
import type { Ctx } from '../lib/types'
import type { TicketRequestRow } from '../../shared/types'

function nanoid(len = 21): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  for (const byte of arr) id += chars[byte % chars.length]
  return id
}

interface TicketWithWorkflow extends TicketRequestRow {
  workflow_name: string | null
  workflow_color: string | null
}

export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')

  // Enforce proper project access
  const access = await requireProjectAccess(request, env, { slug: slug ?? undefined })
  if (access instanceof Response) return access

  const projectId = access.projectInfo.projectId

  const status   = url.searchParams.get('status')
  const category = url.searchParams.get('category')
  const priority = url.searchParams.get('priority')

  let query = `
    SELECT tr.*,
           w.short_name as workflow_name,
           w.color      as workflow_color
    FROM ticket_requests tr
    LEFT JOIN workflows w ON tr.workflow_id = w.id
    WHERE tr.project_id = ?
  `
  const params: Array<string | number> = [projectId]

  if (status)   { query += ' AND tr.status = ?';   params.push(status) }
  if (category) { query += ' AND tr.category = ?'; params.push(category) }
  if (priority) { query += ' AND tr.priority = ?'; params.push(priority) }

  query += ' ORDER BY tr.created_at DESC'

  const { limit, offset } = parsePagination(url)
  query += ' LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const { results } = await env.ddsr_dashboard.prepare(query).bind(...params).all<TicketWithWorkflow>()
  return Response.json(results)
}

export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  let slug: string | null
  let title: string
  let description: string
  let category: string | null
  let priority: string | null
  let workflow_id: number | null
  let requested_due_date: string | null
  try {
    const body = await readJson(request)
    title = requireString(body, 'title')
    description = requireString(body, 'description')
    slug = optString(body, 'slug')
    category = optString(body, 'category')
    priority = optString(body, 'priority')
    workflow_id = optNumber(body, 'workflow_id')
    requested_due_date = optString(body, 'requested_due_date')
  } catch (err) {
    return badRequestResponse(err)
  }

  // Enforce that the user has access to this project
  const access = await requireProjectAccess(request, env, { slug: slug ?? undefined })
  if (access instanceof Response) return access

  const projectId = access.projectInfo.projectId
  const user = access.session.user

  const id  = nanoid()
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    INSERT INTO ticket_requests
      (id, project_id, submitted_by_id, submitted_by_name, title, description,
       category, priority, workflow_id, requested_due_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
  `).bind(
    id, projectId,
    user?.id   || null,
    user?.name || user?.email || null,
    title.trim(), description.trim(),
    category || 'Other', priority || 'Normal',
    workflow_id || null, requested_due_date || null,
    now, now
  ).run()

  const ticket = await env.ddsr_dashboard.prepare(`
    SELECT tr.*, w.short_name as workflow_name, w.color as workflow_color
    FROM ticket_requests tr
    LEFT JOIN workflows w ON tr.workflow_id = w.id
    WHERE tr.id = ?
  `).bind(id).first<TicketWithWorkflow>()

  return Response.json(ticket, { status: 201 })
}
