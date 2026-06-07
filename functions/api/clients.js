import { requireAdminUser, isAdmin, requireSession } from '../lib/authz.js'
import { isValidSlug, slugTaken } from '../lib/slug.js'

export async function onRequestPost({ env, request }) {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user
  const { name, display_name, slug, email_domain } = await request.json()
  if (!name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })
  if (!display_name?.trim()) return Response.json({ error: 'display_name is required' }, { status: 400 })
  if (!slug?.trim()) return Response.json({ error: 'slug is required' }, { status: 400 })

  const cleanSlug = slug.trim()
  if (!isValidSlug(cleanSlug)) {
    return Response.json({ error: 'Slug must be lowercase letters, numbers, and single hyphens' }, { status: 400 })
  }
  // Slugs share a URL namespace with projects, so enforce global uniqueness.
  if (await slugTaken(env, cleanSlug)) return Response.json({ error: 'Slug already in use' }, { status: 409 })

  const now = new Date().toISOString()
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO clients (name, display_name, slug, email_domain, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `).bind(name.trim(), display_name.trim(), cleanSlug, email_domain?.trim().toLowerCase() || null, now, now).run()

  const client = await env.ddsr_dashboard.prepare('SELECT * FROM clients WHERE id = ?').bind(meta.last_row_id).first()
  return Response.json(client, { status: 201 })
}

export async function onRequestGet({ env, request }) {
  const session = await requireSession(request, env)
  if (session instanceof Response) {
    // For clients list, unauthenticated users get nothing (or we could allow public clients, but for now strict)
    return Response.json([])
  }
  const user = session.user

  const isInternal = isAdmin(user)

  const db = env.ddsr_dashboard

  let clientRows

  if (isInternal) {
    // Internal team sees everything, including deactivated clients (so they can be reactivated)
    clientRows = await db.prepare(
      `SELECT id, slug, display_name, name, email_domain, is_active FROM clients ORDER BY is_active DESC, name`
    ).all()
  } else if (user?.id) {
    // Regular users only see clients they have explicit membership in
    clientRows = await db.prepare(`
      SELECT c.id, c.slug, c.display_name, c.name, c.email_domain, c.is_active
      FROM clients c
      JOIN user_clients uc ON uc.client_id = c.id
      WHERE uc.user_id = ? AND c.is_active = 1
      ORDER BY c.name
    `).bind(user.id).all()
  } else {
    clientRows = { results: [] }
  }

  const projects = await db.prepare(
    `SELECT id, slug, name, subtitle, client_id FROM projects WHERE is_active = 1 ORDER BY name`
  ).all()

  const result = clientRows.results.map(c => ({
    ...c,
    projects: projects.results.filter(p => p.client_id === c.id),
  }))

  return Response.json(result)
}
