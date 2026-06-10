import { requireAdminUser } from '../../lib/authz'
import { readJson, badRequestResponse } from '../../lib/validate'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { UserRow } from '../../../shared/types'

type UserDetailRow = Pick<UserRow, 'id' | 'name' | 'email' | 'emailVerified' | 'isAdmin' | 'createdAt'>

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  const id = routeParam(params, 'id')
  let body: Record<string, unknown>
  let makeAdmin: boolean | undefined
  try {
    body = await readJson(request)
    makeAdmin = typeof body.isAdmin === 'boolean' ? body.isAdmin : undefined
  } catch (err) {
    return badRequestResponse(err)
  }
  const now = Date.now()

  // clientSlug is completely removed from the user access model.
  // We accept clientSlugs[] to sync the user_clients join table (the single source of truth).
  const slugsToAssign = Array.isArray(body.clientSlugs) ? body.clientSlugs as string[] : []

  // Update only isAdmin + timestamp on the user row (no more clientSlug)
  await env.ddsr_dashboard.prepare(
    `UPDATE user SET isAdmin = ?, updatedAt = ? WHERE id = ?`
  ).bind(makeAdmin ? 1 : 0, now, id).run()

  // Replace memberships with the new set (source of truth)
  if (Object.prototype.hasOwnProperty.call(body, 'clientSlugs')) {
    await env.ddsr_dashboard.prepare(
      'DELETE FROM user_clients WHERE user_id = ?'
    ).bind(id).run()

    for (const slug of slugsToAssign) {
      const client = await env.ddsr_dashboard
        .prepare('SELECT id FROM clients WHERE slug = ? LIMIT 1')
        .bind(slug)
        .first<{ id: number }>()

      if (client) {
        await env.ddsr_dashboard.prepare(`
          INSERT OR IGNORE INTO user_clients (user_id, client_id, role, created_at, updated_at)
          VALUES (?, ?, 'member', ?, ?)
        `).bind(id, client.id, new Date().toISOString(), new Date().toISOString()).run()
      }
    }
  }

  const updatedUser = await env.ddsr_dashboard.prepare(
    `SELECT id, name, email, emailVerified, isAdmin, createdAt FROM user WHERE id = ?`
  ).bind(id).first<UserDetailRow>()

  return Response.json(updatedUser)
}

export async function onRequestDelete({ env, params, request }: Ctx): Promise<Response> {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin
  const id = routeParam(params, 'id')
  if (id === admin.id) return Response.json({ error: 'Cannot delete your own account' }, { status: 400 })

  await env.ddsr_dashboard.prepare('DELETE FROM user WHERE id = ?').bind(id).run()
  return Response.json({ deleted: true })
}
