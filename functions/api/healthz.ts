import type { Ctx } from '../lib/types'

export async function onRequest({ env }: Ctx): Promise<Response> {
  // Public health check — must not leak which secrets/bindings are configured.
  // Report only overall liveness (can we reach the DB), nothing about config state.
  let ok = false
  try {
    await env.ddsr_dashboard.prepare('SELECT 1').first()
    ok = true
  } catch {
    ok = false
  }

  return Response.json({ ok, timestamp: new Date().toISOString() })
}
