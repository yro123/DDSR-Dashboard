import { createAuth } from '../../lib/auth'

export async function onRequest({ request, env }) {
  try {
    const auth = createAuth(env)
    return await auth.handler(request)
  } catch (err) {
    console.error('[auth handler]', err)
    return Response.json({ message: err?.message || 'Auth service error' }, { status: 500 })
  }
}
