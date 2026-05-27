import { createAuth } from '../../lib/auth'

const isAdminUser = u => !!(u?.isAdmin) || u?.email?.endsWith('@datadrivensr.com')

const fetchTicket = (env, id) => env.ddsr_dashboard.prepare(`
  SELECT tr.*, w.short_name as workflow_name, w.color as workflow_color
  FROM ticket_requests tr
  LEFT JOIN workflows w ON tr.workflow_id = w.id
  WHERE tr.id = ?
`).bind(id).first()

export async function onRequestGet({ env, params }) {
  const ticket = await fetchTicket(env, params.id)
  if (!ticket) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(ticket)
}

export async function onRequestPut({ env, params, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { status, title, description, category, priority, workflow_id, requested_due_date,
          reviewer_notes, rejection_reason,
          task_workflow_id, task_assignee_id, task_due_date } = body

  const now = Date.now()

  // Status transitions require admin
  if (status) {
    if (!isAdminUser(session.user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

    if (status === 'Approved') {
      const ticket = await fetchTicket(env, params.id)
      if (!ticket) return Response.json({ error: 'Not found' }, { status: 404 })

      const taskNow = new Date().toISOString()
      const { meta } = await env.ddsr_dashboard.prepare(`
        INSERT INTO tasks
          (project_id, workflow_id, assignee_id, title, notes, status, due_date, source_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Not Started', ?, 'manual', ?, ?)
      `).bind(
        ticket.project_id,
        task_workflow_id || null,
        task_assignee_id || null,
        ticket.title,
        `From ticket request:\n${ticket.description}`,
        task_due_date || null,
        taskNow, taskNow
      ).run()

      const taskId = meta.last_row_id

      await env.ddsr_dashboard.prepare(`
        UPDATE ticket_requests
        SET status = 'Approved', task_id = ?, reviewer_notes = ?,
            reviewed_by = ?, reviewed_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(taskId, reviewer_notes || null, session.user.name || session.user.email, now, now, params.id).run()

      const [updatedTicket, task] = await Promise.all([
        fetchTicket(env, params.id),
        env.ddsr_dashboard.prepare(`
          SELECT t.*, COALESCE(u.name, pe.name) AS assignee_name,
                 w.short_name as workflow_name, w.color as workflow_color
          FROM tasks t
          LEFT JOIN workflows w ON t.workflow_id = w.id
          LEFT JOIN people pe ON pe.id = t.assignee_id
          LEFT JOIN "user" u ON u.id = pe.user_id
          WHERE t.id = ?
        `).bind(taskId).first(),
      ])
      return Response.json({ ticket: updatedTicket, task })
    }

    if (status === 'Rejected') {
      await env.ddsr_dashboard.prepare(`
        UPDATE ticket_requests
        SET status = 'Rejected', rejection_reason = ?, reviewer_notes = ?,
            reviewed_by = ?, reviewed_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(rejection_reason || null, reviewer_notes || null,
              session.user.name || session.user.email, now, now, params.id).run()
    } else if (status === 'Deferred') {
      await env.ddsr_dashboard.prepare(`
        UPDATE ticket_requests
        SET status = 'Deferred', reviewer_notes = ?,
            reviewed_by = ?, reviewed_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(reviewer_notes || null, session.user.name || session.user.email, now, now, params.id).run()
    } else if (status === 'In Review') {
      await env.ddsr_dashboard.prepare(`
        UPDATE ticket_requests
        SET status = 'In Review', reviewer_notes = ?, updated_at = ?
        WHERE id = ?
      `).bind(reviewer_notes || null, now, params.id).run()
    } else if (status === 'Pending') {
      await env.ddsr_dashboard.prepare(`
        UPDATE ticket_requests SET status = 'Pending', updated_at = ? WHERE id = ?
      `).bind(now, params.id).run()
    }

    const updated = await fetchTicket(env, params.id)
    return Response.json({ ticket: updated })
  }

  // Field edits (submitter editing their own Pending ticket)
  await env.ddsr_dashboard.prepare(`
    UPDATE ticket_requests
    SET title = ?, description = ?, category = ?, priority = ?,
        workflow_id = ?, requested_due_date = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    title, description, category, priority,
    workflow_id || null, requested_due_date || null,
    now, params.id
  ).run()

  const updated = await fetchTicket(env, params.id)
  return Response.json({ ticket: updated })
}

export async function onRequestDelete({ env, params, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!isAdminUser(session?.user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  await env.ddsr_dashboard.prepare('DELETE FROM ticket_requests WHERE id = ?').bind(params.id).run()
  return Response.json({ deleted: true })
}
