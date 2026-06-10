import { requireAdminUser } from '../../lib/authz'
import { buildDomainMap, findMatch, orderByClause } from '../../lib/email-domains'
import { parsePagination } from '../../lib/pagination'
import type { Ctx } from '../../lib/types'

// Projection of the email_snapshots columns selected below. The assessment
// columns are only present when migration 0025 has been applied, hence optional.
interface SnapshotRow {
  message_id: string
  subject: string | null
  from_name: string | null
  from_email: string
  received_at: string
  body_preview: string | null
  body_full: string | null
  source_type: string | null
  recipients_json: string | null
  is_task?: number | null
  urgency?: string | null
  criticality?: string | null
  resolution_bucket?: string | null
  solution_outline?: string | null
  assessment_status?: string | null
  resolved_at?: string | null
  suggest_block?: number | null
  block_reason?: string | null
}

interface SnapshotGroup {
  project_id: number
  project_name: string
  client_domain: string
  emails: SnapshotRow[]
}

// GET /api/admin/email-snapshots
// Returns email snapshots grouped by matched project (admin only).
// Optional: ?since=ISO&until=ISO (day window), ?sort=urgency|criticality|resolution|received, ?dir=asc|desc
export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const db = env.ddsr_dashboard

  const url = new URL(request.url)
  const since = url.searchParams.get('since')
  const until = url.searchParams.get('until')
  const sort = url.searchParams.get('sort')
  const dir = url.searchParams.get('dir')

  const where = ["source_type != 'fathom'"]
  const binds: string[] = []
  if (since) { where.push('received_at >= ?'); binds.push(since) }
  if (until) { where.push('received_at < ?');  binds.push(until) }
  const whereSql = where.join(' AND ')
  const orderSql = sort ? orderByClause(sort, dir) : 'received_at DESC'
  const { limit, offset } = parsePagination(url, 300, 500)

  // Newest assessment columns. Fall back gracefully if the 0025 migration
  // hasn't been applied yet (older DBs lack these columns).
  const newCols = `, is_task, urgency, criticality, resolution_bucket, solution_outline, assessment_status, resolved_at, suggest_block, block_reason`
  const baseCols = `message_id, subject, from_name, from_email, received_at, body_preview, body_full, source_type, recipients_json`

  let snapshots: SnapshotRow[]
  try {
    const r = await db.prepare(`
      SELECT ${baseCols}${newCols}
      FROM email_snapshots
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ? OFFSET ?
    `).bind(...binds, limit, offset).all<SnapshotRow>()
    snapshots = r.results
  } catch {
    const r = await db.prepare(`
      SELECT ${baseCols}
      FROM email_snapshots
      WHERE ${whereSql}
      ORDER BY received_at DESC
      LIMIT ? OFFSET ?
    `).bind(...binds, limit, offset).all<SnapshotRow>()
    snapshots = r.results
  }

  const domainMap = await buildDomainMap(db)

  const groupMap = new Map<number, SnapshotGroup>()
  const unmatched: SnapshotRow[] = []

  for (const snapshot of snapshots) {
    const match = findMatch(snapshot, domainMap)
    if (match) {
      if (!groupMap.has(match.project_id)) {
        groupMap.set(match.project_id, {
          project_id: match.project_id,
          project_name: match.project_name,
          client_domain: match.client_domain,
          emails: [],
        })
      }
      groupMap.get(match.project_id)!.emails.push(snapshot)
    } else {
      unmatched.push(snapshot)
    }
  }

  const groups = Array.from(groupMap.values())

  return Response.json({ groups, unmatched })
}
