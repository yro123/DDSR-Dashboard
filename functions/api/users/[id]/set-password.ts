import { requireAdminUser } from '../../../lib/authz'
import { hashPassword } from '../../../lib/auth'
import { routeParam } from '../../../lib/types'
import type { Ctx } from '../../../lib/types'

interface SetPasswordBody {
  password?: string
}

export async function onRequestPost({ env, params, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const { password } = (await request.json()) as SetPasswordBody
  if (!password || password.length < 8)
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const hashed = await hashPassword(password)

  const { meta } = await env.ddsr_dashboard.prepare(
    `UPDATE account SET password = ?, updatedAt = ? WHERE userId = ? AND providerId = 'credential'`
  ).bind(hashed, Date.now(), routeParam(params, 'id')).run()

  if (meta.changes === 0)
    return Response.json({ error: 'No credential account found for this user' }, { status: 404 })

  return Response.json({ ok: true })
}
