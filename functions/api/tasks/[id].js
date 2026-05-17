export async function onRequestGet({ env, params }) {
  const task = await env.ddsr_dashboard.prepare(`
    SELECT t.*, w.short_name as workflow_name, w.color as workflow_color
    FROM tasks t
    LEFT JOIN workflows w ON t.workflow_id = w.id
    WHERE t.id = ?
  `).bind(params.id).first();

  if (!task) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(task);
}

export async function onRequestPut({ env, params, request }) {
  const body = await request.json();
  const { workflow_id, assignee_id, assignee_name, title, notes, status, priority, due_date, is_archived } = body;

  const now = new Date().toISOString();
  const archived_at = is_archived ? now : null;

  await env.ddsr_dashboard.prepare(`
    UPDATE tasks SET
      workflow_id   = ?,
      assignee_id   = ?,
      assignee_name = ?,
      title         = ?,
      notes         = ?,
      status        = ?,
      priority      = ?,
      due_date      = ?,
      is_archived   = ?,
      archived_at   = ?,
      updated_at    = ?
    WHERE id = ?
  `).bind(
    workflow_id ?? null, assignee_id ?? null, assignee_name ?? null,
    title, notes ?? null, status, priority ?? null, due_date ?? null,
    is_archived ? 1 : 0, archived_at, now, params.id
  ).run();

  const task = await env.ddsr_dashboard.prepare('SELECT * FROM tasks WHERE id = ?').bind(params.id).first();
  return Response.json(task);
}

export async function onRequestDelete({ env, params }) {
  await env.ddsr_dashboard.prepare('DELETE FROM tasks WHERE id = ?').bind(params.id).run();
  return Response.json({ deleted: true });
}
