export async function onRequest({ env }) {
  // Public health check — never leak secrets or schema
  const hasSecret = !!env.BETTER_AUTH_SECRET
  const hasDb = !!env.ddsr_dashboard

  let dbOk = false
  try {
    if (hasDb) {
      await env.ddsr_dashboard.prepare('SELECT 1').first()
      dbOk = true
    }
  } catch {
    dbOk = false
  }

  return Response.json({
    ok: hasDb && hasSecret && dbOk,
    db: dbOk,
    auth: hasSecret,
    timestamp: new Date().toISOString(),
  })
}
