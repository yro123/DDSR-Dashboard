import { requireAdminUser } from '../../lib/authz.js'
import { buildDomainMap, findMatch, orderByClause } from '../../lib/email-domains.js'

// GET /api/admin/email-attention
// Flat, cross-client list of non-task, unresolved emails from the last 3 days
// (the "Needs Attention" box). Optional ?sort= & ?dir= (default urgency desc).
export async function onRequestGet({ env, request }) {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const db = env.ddsr_dashboard
  const url = new URL(request.url)
  const orderSql = orderByClause(url.searchParams.get('sort'), url.searchParams.get('dir'))

  const since = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()

  let snapshots
  try {
    const r = await db.prepare(`
      SELECT message_id, subject, from_name, from_email, received_at,
             body_preview, body_full, source_type, recipients_json,
             is_task, urgency, criticality, resolution_bucket, solution_outline,
             assessment_status, resolved_at
      FROM email_snapshots
      WHERE source_type != 'fathom'
        AND is_task = 0
        AND resolved_at IS NULL
        AND assessment_status IN ('needs_response', 'waiting_on_others')
        AND received_at >= ?
      ORDER BY ${orderSql}
      LIMIT 200
    `).bind(since).all()
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
