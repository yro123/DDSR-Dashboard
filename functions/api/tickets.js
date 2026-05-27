import { createAuth } from '../lib/auth'

function nanoid(len = 21) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  for (const byte of arr) id += chars[byte % chars.length]
  return id
}

async function resolveProjectId(env, slug) {
  if (!slug) return null
  const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first()
  return proj?.id ?? null
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url)
  const slug     = url.searchParams.get('slug')
  const status   = url.searchParams.get('status')
  const category = url.searchParams.get('category')
  const priority = url.searchParams.get('priority')

  const projectId = await resolveProjectId(env, slug)
  if (!projectId) return Response.json({ error: 'Project not found' }, { status: 404 })

  let query = `
    SELECT tr.*,
           w.short_name as workflow_name,
           w.color      as workflow_color
    FROM ticket_requests tr
    LEFT JOIN workflows w ON tr.workflow_id = w.id
    WHERE tr.project_id = ?
  `
  const params = [projectId]

  if (status)   { query += ' AND tr.status = ?';   params.push(status) }
  if (category) { query += ' AND tr.category = ?'; params.push(category) }
  if (priority) { query += ' AND tr.priority = ?'; params.push(priority) }

  query += ' ORDER BY tr.created_at DESC'

  const { results } = await env.ddsr_dashboard.prepare(query).bind(...params).all()
  return Response.json(results)
}

export async function onRequestPost({ env, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })

  const body = await request.json()
  const { slug, title, description, category, priority, workflow_id, requested_due_date } = body

  if (!title?.trim())       return Response.json({ error: 'title is required' }, { status: 400 })
  if (!description?.trim()) return Response.json({ error: 'description is required' }, { status: 400 })

  const projectId = await resolveProjectId(env, slug)
  if (!projectId) return Response.json({ error: 'Project not found' }, { status: 404 })

  const id  = nanoid()
  const now = Date.now()

  await env.ddsr_dashboard.prepare(`
    INSERT INTO ticket_requests
      (id, project_id, submitted_by_id, submitted_by_name, title, description,
       category, priority, workflow_id, requested_due_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
  `).bind(
    id, projectId,
    session?.user?.id   || null,
    session?.user?.name || session?.user?.email || null,
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
  `).bind(id).first()

  return Response.json(ticket, { status: 201 })
}
