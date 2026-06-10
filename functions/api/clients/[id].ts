import { requireSession, isAdmin } from '../../lib/authz'
import { isValidSlug, slugTaken } from '../../lib/slug'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { ClientRow, UpdateClientBody } from '../../../shared/types'

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  if (!isAdmin(session.user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, display_name, slug, is_active, email_domain } = await request.json() as UpdateClientBody

  const cleanSlug = slug?.trim()
  if (!cleanSlug) return Response.json({ error: 'slug is required' }, { status: 400 })
  if (!isValidSlug(cleanSlug)) {
    return Response.json({ error: 'Slug must be lowercase letters, numbers, and single hyphens' }, { status: 400 })
  }
  const id = routeParam(params, 'id')
  const clientId = Number(id)
  if (await slugTaken(env, cleanSlug, { exceptClientId: clientId })) {
    return Response.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE clients SET name = ?, display_name = ?, slug = ?, is_active = ?, email_domain = ?, updated_at = ?
    WHERE id = ?
  `).bind(name?.trim() || null, display_name?.trim() || null, cleanSlug,
      is_active ?? 1, email_domain?.trim().toLowerCase() || null, now, id).run()

  const client = await env.ddsr_dashboard.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first<ClientRow>()
  if (!client) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(client)
}
