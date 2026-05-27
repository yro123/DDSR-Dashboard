import { createAuth } from '../../../lib/auth'
import { hashPassword } from 'better-auth/crypto'

const isAdminUser = u => !!(u?.isAdmin) || u?.email?.endsWith('@datadrivensr.com')

export async function onRequestPost({ env, params, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!isAdminUser(session?.user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { password } = await request.json()
  if (!password || password.length < 8)
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const hashed = await hashPassword(password)

  const { meta } = await env.ddsr_dashboard.prepare(
    `UPDATE account SET password = ?, updatedAt = ? WHERE userId = ? AND providerId = 'credential'`
  ).bind(hashed, Date.now(), params.id).run()

  if (meta.changes === 0)
    return Response.json({ error: 'No credential account found for this user' }, { status: 404 })

  return Response.json({ ok: true })
}
