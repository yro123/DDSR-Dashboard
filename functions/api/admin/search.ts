import { requireAdminUser } from '../../lib/authz'
import type { Ctx } from '../../lib/types'
import type { ProjectSlug } from '../../../shared/types'

// Projection returned by the task search query (joins assignee + workflow + project).
interface SearchResultRow {
  id: number
  title: string
  status: string
  priority: string | null
  due_date: string | null
  source_type: string | null
  assignee_name: string | null
  workflow_name: string | null
  workflow_color: string | null
  project_name: string | null
  project_slug: ProjectSlug | null
}

export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const q = new URL(request.url).searchParams.get('q')?.trim()
  if (!q || q.length < 3) return Response.json([])

  const like = `%${q}%`
  const { results } = await env.ddsr_dashboard.prepare(`
    SELECT t.id, t.title, t.status, t.priority, t.due_date, t.source_type,
           COALESCE(u.name, pe.name) AS assignee_name,
           w.short_name AS workflow_name, w.color AS workflow_color,
           p.name AS project_name, p.slug AS project_slug
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN workflows w ON t.workflow_id = w.id
    LEFT JOIN people pe ON pe.id = t.assignee_id
    LEFT JOIN "user" u ON u.id = pe.user_id
    WHERE t.is_archived = 0
      AND (t.title LIKE ? OR t.notes LIKE ?)
    ORDER BY p.name ASC, t.due_date ASC
    LIMIT 100
  `).bind(like, like).all<SearchResultRow>()

  return Response.json(results)
}
