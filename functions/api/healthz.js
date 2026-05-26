export async function onRequest({ env }) {
  try {
    const tables = await env.ddsr_dashboard
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
    const secret = !!env.BETTER_AUTH_SECRET
    return Response.json({ ok: true, secret, tables: tables.results.map(r => r.name) })
  } catch (err) {
    return Response.json({ ok: false, error: err?.message }, { status: 500 })
  }
}
