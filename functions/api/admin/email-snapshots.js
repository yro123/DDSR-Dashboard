import { requireAdminUser } from '../../lib/authz.js'
import { buildDomainMap, findMatch, orderByClause } from '../../lib/email-domains.js'

// GET /api/admin/email-snapshots
// Returns email snapshots grouped by matched project (admin only).
// Optional: ?since=ISO&until=ISO (day window), ?sort=urgency|criticality|resolution|received, ?dir=asc|desc
export async function onRequestGet({ env, request }) {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const db = env.ddsr_dashboard

  const url = new URL(request.url)
  const since = url.searchParams.get('since')
  const until = url.searchParams.get('until')
  const sort = url.searchParams.get('sort')
  const dir = url.searchParams.get('dir')

  const where = ["source_type != 'fathom'"]
  const binds = []
  if (since) { where.push('received_at >= ?'); binds.push(since) }
  if (until) { where.push('received_at < ?');  binds.push(until) }
  const whereSql = where.join(' AND ')
  const orderSql = sort ? orderByClause(sort, dir) : 'received_at DESC'

  // Newest assessment columns. Fall back gracefully if the 0025 migration
  // hasn't been applied yet (older DBs lack these columns).
  const newCols = `, is_task, urgency, criticality, resolution_bucket, solution_outline, assessment_status, resolved_at`
  const baseCols = `message_id, subject, from_name, from_email, received_at, body_preview, body_full, source_type, recipients_json`

  let snapshots
  try {
    const r = await db.prepare(`
      SELECT ${baseCols}${newCols}
      FROM email_snapshots
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT 300
    `).bind(...binds).all()
    snapshots = r.results
  } catch {
    const r = await db.prepare(`
      SELECT ${baseCols}
      FROM email_snapshots
      WHERE ${whereSql}
      ORDER BY received_at DESC
      LIMIT 300
    `).bind(...binds).all()
    snapshots = r.results
  }

  const domainMap = await buildDomainMap(db)

  /** @type {Map<number, {project_id: number, project_name: string, client_domain: string, emails: any[]}>} */
  const groupMap = new Map()
  const unmatched = []

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
      groupMap.get(match.project_id).emails.push(snapshot)
    } else {
      unmatched.push(snapshot)
    }
  }

  const groups = Array.from(groupMap.values())

  return Response.json({ groups, unmatched })
}
