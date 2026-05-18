export async function onRequestPut({ env, params, request }) {
  const { description, phase } = await request.json()
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(
    `UPDATE workflows SET description = ?, phase = ?, updated_at = ? WHERE id = ?`
  ).bind(description ?? null, phase ?? null, now, params.id).run()

  const wf = await env.ddsr_dashboard.prepare('SELECT * FROM workflows WHERE id = ?').bind(params.id).first()
  if (!wf) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(wf)
}
