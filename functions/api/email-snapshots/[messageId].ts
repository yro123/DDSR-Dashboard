import { requireAdminUser } from '../../lib/authz'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'

export async function onRequestGet({ env, params, request }: Ctx): Promise<Response> {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  const snapshot = await env.ddsr_dashboard
    .prepare('SELECT * FROM email_snapshots WHERE message_id = ?')
    .bind(routeParam(params, 'messageId'))
    .first<Record<string, unknown>>()

  if (!snapshot) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(snapshot)
}
