import { requireAdminUser } from '../../lib/authz.js'

// GET /api/admin/email-snapshots
// Returns email snapshots grouped by matched project (admin only).
export async function onRequestGet({ env, request }) {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const db = env.ddsr_dashboard

  // Load snapshots (exclude fathom, newest first, limit 300).
  // Try with recipients_json first; fall back gracefully if the column doesn't exist yet.
  let snapshots
  try {
    const r = await db.prepare(`
      SELECT message_id, subject, from_name, from_email, received_at,
             body_preview, source_type, recipients_json
      FROM email_snapshots
      WHERE source_type != 'fathom'
      ORDER BY received_at DESC
      LIMIT 300
    `).all()
    snapshots = r.results
  } catch {
    const r = await db.prepare(`
      SELECT message_id, subject, from_name, from_email, received_at,
             body_preview, source_type
      FROM email_snapshots
      WHERE source_type != 'fathom'
      ORDER BY received_at DESC
      LIMIT 300
    `).all()
    snapshots = r.results
  }

  // Build domain map from clients JOIN projects
  const { results: domainRows } = await db.prepare(`
    SELECT c.email_domain, c.display_name AS client_name, p.id AS project_id, p.name AS project_name
    FROM clients c
    JOIN projects p ON p.client_id = c.id
    WHERE c.email_domain IS NOT NULL AND c.email_domain != '' AND c.is_active = 1 AND p.is_active = 1
  `).all()

  /** @type {Record<string, {project_id: number, project_name: string, client_domain: string}>} */
  const domainMap = {}
  for (const row of domainRows) {
    domainMap[row.email_domain.toLowerCase()] = {
      project_id: row.project_id,
      project_name: row.project_name,
      client_domain: row.email_domain.toLowerCase(),
    }
  }

  // Helper: extract domain from an email address string
  function getDomain(email) {
    if (!email || !email.includes('@')) return null
    return email.split('@')[1].toLowerCase()
  }

  // Helper: find project match for a snapshot
  function findMatch(snapshot) {
    // 1. Check from_email domain
    const fromDomain = getDomain(snapshot.from_email)
    if (fromDomain && domainMap[fromDomain]) {
      return domainMap[fromDomain]
    }

    // 2. Check recipients_json if set
    if (snapshot.recipients_json) {
      let recipients
      try {
        recipients = JSON.parse(snapshot.recipients_json)
      } catch {
        recipients = []
      }
      if (Array.isArray(recipients)) {
        for (const email of recipients) {
          const domain = getDomain(email)
          if (domain && domainMap[domain]) {
            return domainMap[domain]
          }
        }
      }
    }

    return null
  }

  // Group snapshots
  /** @type {Map<number, {project_id: number, project_name: string, client_domain: string, emails: any[]}>} */
  const groupMap = new Map()
  const unmatched = []

  for (const snapshot of snapshots) {
    const match = findMatch(snapshot)
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
