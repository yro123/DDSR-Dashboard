async function resolveProjectId(env, url) {
  const slug = url.searchParams.get('slug');
  if (slug) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first();
    if (!proj) return null;
    return proj.id;
  }
  return url.searchParams.get('project_id') || 1;
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const projectId = await resolveProjectId(env, url);
  if (projectId === null) return Response.json({ error: 'Project not found' }, { status: 404 });
  const workflowId = url.searchParams.get('workflow_id');
  const assigneeId = url.searchParams.get('assignee_id');
  const status = url.searchParams.get('status');
  const archived = url.searchParams.get('archived') || '0';

  let query = `
    SELECT t.*, w.short_name as workflow_name, w.color as workflow_color, w.bg_color as workflow_bg
    FROM tasks t
    LEFT JOIN workflows w ON t.workflow_id = w.id
    WHERE t.project_id = ?
    AND t.is_archived = ?
  `;
  const params = [projectId, archived];

  if (workflowId) { query += ' AND t.workflow_id = ?'; params.push(workflowId); }
  if (assigneeId) { query += ' AND t.assignee_id = ?'; params.push(assigneeId); }
  if (status)     { query += ' AND t.status = ?';      params.push(status); }

  query += ' ORDER BY t.due_date ASC, t.id ASC';

  const { results } = await env.ddsr_dashboard.prepare(query).bind(...params).all();
  return Response.json(results);
}

export async function onRequestPost({ env, request }) {
  const body = await request.json();
  let { project_id, slug, workflow_id, assignee_id, assignee_name, title, notes, status, priority, due_date } = body;
  if (slug && !project_id) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first();
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 });
    project_id = proj.id;
  }
  project_id = project_id || 1;

  if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 });

  const now = new Date().toISOString();
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(project_id, workflow_id || null, assignee_id || null, assignee_name || null,
      title.trim(), notes || null, status || 'Not Started', priority || null, due_date || null, now, now).run();

  const task = await env.ddsr_dashboard.prepare('SELECT * FROM tasks WHERE id = ?').bind(meta.last_row_id).first();
  return Response.json(task, { status: 201 });
}
