import { requireAdminUser, requireProjectAccess } from '../lib/authz.js'

async function resolveProjectId(env, url) {
  const slug = url.searchParams.get('slug')
  if (slug) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first()
    if (!proj) return null
    return proj.id
  }
  const explicit = url.searchParams.get('project_id')
  if (explicit) return explicit
  return null // no more silent default to project 1
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const review = url.searchParams.get('review') === '1';
  const all    = url.searchParams.get('all')    === '1';

  // Admin-only: review queue across ALL projects
  if (review && all) {
    const user = await requireAdminUser(request, env)
    if (user instanceof Response) return user

    const { results } = await env.ddsr_dashboard.prepare(`
      SELECT t.*,
             COALESCE(u.name, pe.name) AS assignee_name,
             w.short_name as workflow_name, w.color as workflow_color, w.bg_color as workflow_bg,
             e.subject as email_subject, e.from_name as email_from_name,
             e.from_email as email_from_email, e.received_at as email_received_at,
             e.body_preview as email_body_preview,
             p.name as project_name, p.slug as project_slug
      FROM tasks t
      LEFT JOIN workflows w ON t.workflow_id = w.id
      LEFT JOIN email_snapshots e ON t.source_email_id = e.message_id
      LEFT JOIN people pe ON pe.id = t.assignee_id
      LEFT JOIN "user" u ON u.id = pe.user_id
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.is_archived = 0
        AND t.source_type != 'manual'
        AND (t.confidence < 0.7 OR t.assignee_id IS NULL)
      ORDER BY p.name ASC, t.created_at DESC
    `).all()
    return Response.json(results)
  }

  // For normal requests, enforce proper project/client access via the membership model
  const access = await requireProjectAccess(request, env, { 
    slug: url.searchParams.get('slug'), 
    projectId: url.searchParams.get('project_id') 
  });
  if (access instanceof Response) return access;

  const projectId = access.projectInfo.projectId;

  // For the rest of the function we use the authorized projectId
  const workflowId  = url.searchParams.get('workflow_id');
  const assigneeId  = url.searchParams.get('assignee_id');
  const status      = url.searchParams.get('status');
  const archived    = url.searchParams.get('archived') || '0';

  if (review) {
    // Needs Review queue: low-confidence or unmatched-assignee tasks from automation
    const { results } = await env.ddsr_dashboard.prepare(`
      SELECT t.*,
             COALESCE(u.name, pe.name) AS assignee_name,
             w.short_name as workflow_name, w.color as workflow_color, w.bg_color as workflow_bg,
             e.subject as email_subject, e.from_name as email_from_name,
             e.from_email as email_from_email, e.received_at as email_received_at,
             e.body_preview as email_body_preview
      FROM tasks t
      LEFT JOIN workflows w ON t.workflow_id = w.id
      LEFT JOIN email_snapshots e ON t.source_email_id = e.message_id
      LEFT JOIN people pe ON pe.id = t.assignee_id
      LEFT JOIN "user" u ON u.id = pe.user_id
      WHERE t.project_id = ?
        AND t.is_archived = 0
        AND t.source_type != 'manual'
        AND (t.confidence < 0.7 OR t.assignee_id IS NULL)
      ORDER BY t.created_at DESC
    `).bind(projectId).all();
    return Response.json(results);
  }

  let query = `
    SELECT t.*,
           COALESCE(u.name, pe.name) AS assignee_name,
           w.short_name as workflow_name, w.color as workflow_color, w.bg_color as workflow_bg
    FROM tasks t
    LEFT JOIN workflows w ON t.workflow_id = w.id
    LEFT JOIN people pe ON pe.id = t.assignee_id
    LEFT JOIN "user" u ON u.id = pe.user_id
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
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  const body = await request.json();
  let { project_id, slug, workflow_id, assignee_id, title, notes, status, priority, due_date } = body;
  if (slug && !project_id) {
    const proj = await env.ddsr_dashboard.prepare('SELECT id FROM projects WHERE slug = ? LIMIT 1').bind(slug).first();
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 });
    project_id = proj.id;
  }
  if (!project_id) {
    return Response.json({ error: 'project_id or slug is required' }, { status: 400 })
  }

  if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 });

  const now = new Date().toISOString();
  const { meta } = await env.ddsr_dashboard.prepare(`
    INSERT INTO tasks (project_id, workflow_id, assignee_id, title, notes, status, priority, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(project_id, workflow_id || null, assignee_id || null,
      title.trim(), notes || null, status || 'Not Started', priority || null, due_date || null, now, now).run();

  const task = await env.ddsr_dashboard.prepare(`
    SELECT t.*, COALESCE(u.name, pe.name) AS assignee_name
    FROM tasks t
    LEFT JOIN people pe ON pe.id = t.assignee_id
    LEFT JOIN "user" u ON u.id = pe.user_id
    WHERE t.id = ?
  `).bind(meta.last_row_id).first();
  return Response.json(task, { status: 201 });
}
