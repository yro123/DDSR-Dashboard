export async function onRequestPut({ env, params, request }) {
  const { status, label, summary, points } = await request.json()
  const now = new Date().toISOString()
  const step = await env.ddsr_dashboard.prepare('SELECT * FROM workflow_steps WHERE id = ?').bind(params.id).first()
  if (!step) return Response.json({ error: 'Not found' }, { status: 404 })

  await env.ddsr_dashboard.prepare(
    `UPDATE workflow_steps SET label = ?, status = ?, updated_at = ? WHERE id = ?`
  ).bind(label ?? step.label, status ?? step.status, now, params.id).run()

  if (summary !== undefined || points !== undefined) {
    let detail = await env.ddsr_dashboard.prepare(
      'SELECT * FROM workflow_step_details WHERE workflow_step_id = ?'
    ).bind(params.id).first()

    if (detail) {
      await env.ddsr_dashboard.prepare(
        `UPDATE workflow_step_details SET summary = ?, updated_at = ? WHERE id = ?`
      ).bind(summary ?? detail.summary, now, detail.id).run()
    } else {
      const { meta } = await env.ddsr_dashboard.prepare(
        `INSERT INTO workflow_step_details (workflow_step_id, summary, created_at, updated_at) VALUES (?, ?, ?, ?)`
      ).bind(params.id, summary ?? null, now, now).run()
      detail = { id: meta.last_row_id }
    }

    if (Array.isArray(points)) {
      await env.ddsr_dashboard.prepare(
        'DELETE FROM workflow_step_detail_points WHERE step_detail_id = ?'
      ).bind(detail.id).run()
      for (let i = 0; i < points.length; i++) {
        const pt = points[i].trim()
        if (pt) await env.ddsr_dashboard.prepare(
          `INSERT INTO workflow_step_detail_points (step_detail_id, point_text, sort_order) VALUES (?, ?, ?)`
        ).bind(detail.id, pt, i).run()
      }
    }
  }

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM workflow_steps WHERE id = ?').bind(params.id).first()
  return Response.json(updated)
}
