// GET /api/fathom-meeting-queue
// Returns all pending Fathom meeting queue entries (global, not project-scoped).
// Includes project list for the assignment dropdown.

export async function onRequestGet({ env }) {
  const db = env.ddsr_dashboard

  const { results: entries } = await db.prepare(`
    SELECT fmq.*, p.name AS assigned_project_name
    FROM fathom_meeting_queue fmq
    LEFT JOIN projects p ON fmq.assigned_project_id = p.id
    WHERE fmq.status = 'pending'
    ORDER BY fmq.meeting_date DESC, fmq.id DESC
  `).all()

  // Also return active projects for the assignment dropdown
  const { results: projects } = await db.prepare(`
    SELECT p.id, p.name, p.slug, c.display_name AS client_name
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.is_active = 1
    ORDER BY c.display_name, p.name
  `).all()

  return Response.json({ entries, projects })
}
