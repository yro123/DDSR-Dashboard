import { createAuth } from '../../lib/auth'
import type { Ctx } from '../../lib/types'

export async function onRequest({ request, env }: Ctx): Promise<Response> {
  try {
    const auth = createAuth(env)
    // better-auth's handler type is awkward; it returns a Response at runtime.
    return await (auth.handler(request) as Promise<Response>)
  } catch (err) {
    console.error('[auth handler]', err)
    const message = err instanceof Error ? err.message : 'Auth service error'
    return Response.json({ message: message || 'Auth service error' }, { status: 500 })
  }
}
