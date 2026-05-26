import { createAuth } from '../../lib/auth'

export async function onRequest({ request, env }) {
  try {
    const auth = createAuth(env)
    return await auth.handler(request)
  } catch (err) {
    console.error('[auth handler]', err)
    return Response.json({ error: err?.message || 'Auth error', stack: err?.stack }, { status: 500 })
  }
}
