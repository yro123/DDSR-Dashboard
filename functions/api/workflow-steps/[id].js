export async function onRequestPut({ env, params, request }) {
  const { status } = await request.json()
  const valid = ['Not Started', 'In Progress', 'Done']
  if (!valid.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 })

  const now = new Date().toISOString()
  await env.ddsr_dashboard.prepare(`
    UPDATE workflow_steps SET status = ?, updated_at = ? WHERE id = ?
  `).bind(status, now, params.id).run()

  const step = await env.ddsr_dashboard.prepare('SELECT * FROM workflow_steps WHERE id = ?').bind(params.id).first()
  if (!step) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(step)
}
