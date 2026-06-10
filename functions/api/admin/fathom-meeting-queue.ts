import { requireAdminUser } from '../../lib/authz'
import type { Ctx } from '../../lib/types'
import type { FathomQueueRow, ProjectSlug } from '../../../shared/types'

// Queue entry joined with the (optional) assigned project name.
interface QueueEntryRow extends FathomQueueRow {
  assigned_project_name: string | null
}

// Project option projection for the assign dropdown.
interface ProjectOptionRow {
  id: number
  name: string
  slug: ProjectSlug
  client_name: string | null
}

// GET /api/admin/fathom-meeting-queue
// Returns all pending Fathom meeting queue entries (admin only).
export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const db = env.ddsr_dashboard

  const { results: entries } = await db.prepare(`
    SELECT fmq.*, p.name AS assigned_project_name
    FROM fathom_meeting_queue fmq
    LEFT JOIN projects p ON fmq.assigned_project_id = p.id
    WHERE fmq.status = 'pending'
    ORDER BY fmq.meeting_date DESC, fmq.id DESC
  `).all<QueueEntryRow>()

  const { results: projects } = await db.prepare(`
    SELECT p.id, p.name, p.slug, c.display_name AS client_name
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.is_active = 1
    ORDER BY c.display_name, p.name
  `).all<ProjectOptionRow>()

  return Response.json({ entries, projects })
}
