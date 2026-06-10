import { requireAdminUser } from '../../lib/authz'
import { buildDomainMap, findMatch, orderByClause } from '../../lib/email-domains'
import { parsePagination } from '../../lib/pagination'
import type { Ctx } from '../../lib/types'

// Projection of the email_snapshots columns selected below.
interface AttentionSnapshotRow {
  message_id: string
  subject: string | null
  from_name: string | null
  from_email: string
  received_at: string
  body_preview: string | null
  body_full: string | null
  source_type: string | null
  recipients_json: string | null
  is_task: number | null
  urgency: string | null
  criticality: string | null
  resolution_bucket: string | null
  solution_outline: string | null
  assessment_status: string | null
  resolved_at: string | null
  suggest_block: number | null
  block_reason: string | null
}

// GET /api/admin/email-attention
// Flat, cross-client list of non-task, unresolved emails from the last 3 days
// (the "Needs Attention" box). Optional ?sort= & ?dir= (default urgency desc).
export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const db = env.ddsr_dashboard
  const url = new URL(request.url)
  const orderSql = orderByClause(url.searchParams.get('sort'), url.searchParams.get('dir'))

  const since = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  const { limit, offset } = parsePagination(url, 200, 500)

  let snapshots: AttentionSnapshotRow[]
  try {
    const r = await db.prepare(`
      SELECT message_id, subject, from_name, from_email, received_at,
             body_preview, body_full, source_type, recipients_json,
             is_task, urgency, criticality, resolution_bucket, solution_outline,
             assessment_status, resolved_at, suggest_block, block_reason
      FROM email_snapshots
      WHERE source_type != 'fathom'
        AND is_task = 0
        AND resolved_at IS NULL
        AND assessment_status IN ('needs_response', 'waiting_on_others')
        AND received_at >= ?
      ORDER BY ${orderSql}
      LIMIT ? OFFSET ?
    `).bind(since, limit, offset).all<AttentionSnapshotRow>()
    snapshots = r.results
  } catch {
    // Migration 0025 not applied yet — no assessment columns, so nothing to show.
    return Response.json({ emails: [] })
  }

  const domainMap = await buildDomainMap(db)
  const emails = snapshots.map(s => {
    const match = findMatch(s, domainMap)
    return {
      ...s,
      project_id: match?.project_id ?? null,
      project_name: match?.project_name ?? null,
      client_domain: match?.client_domain ?? null,
    }
  })

  return Response.json({ emails })
}
