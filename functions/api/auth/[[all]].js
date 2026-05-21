import { createAuth } from '../../lib/auth'

export async function onRequest({ request, env }) {
  const auth = createAuth(env)
  return auth.handler(request)
}
