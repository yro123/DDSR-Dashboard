/**
 * Shared client/project domain matching for email snapshots.
 * Used by the Emails tab (grouped view) and the cross-client Needs Attention view.
 */

/** A resolved project match for an email domain. */
export interface DomainMatch {
  project_id: number
  project_name: string
  client_domain: string
}

export type DomainMap = Record<string, DomainMatch>

/** Snapshot shape consumed by findMatch (only the fields it reads). */
export interface EmailSnapshot {
  from_email?: string | null
  recipients_json?: string | null
}

/** Extract the domain from an email address string, lowercased. */
export function getDomain(email: string | null | undefined): string | null {
  if (!email || !email.includes('@')) return null
  return email.split('@')[1].toLowerCase()
}

/**
 * Build a map of email_domain -> { project_id, project_name, client_domain }
 * from active clients joined to active projects.
 */
export async function buildDomainMap(db: D1Database): Promise<DomainMap> {
  interface DomainRow {
    email_domain: string
    client_name: string
    project_id: number
    project_name: string
  }

  const { results } = await db.prepare(`
    SELECT c.email_domain, c.display_name AS client_name, p.id AS project_id, p.name AS project_name
    FROM clients c
    JOIN projects p ON p.client_id = c.id
    WHERE c.email_domain IS NOT NULL AND c.email_domain != '' AND c.is_active = 1 AND p.is_active = 1
  `).all<DomainRow>()

  const map: DomainMap = {}
  for (const row of results) {
    map[row.email_domain.toLowerCase()] = {
      project_id: row.project_id,
      project_name: row.project_name,
      client_domain: row.email_domain.toLowerCase(),
    }
  }
  return map
}

/**
 * Find the project match for a snapshot — by sender domain first, then any
 * stored recipient (to/cc) domain. Returns the match object or null.
 */
export function findMatch(snapshot: EmailSnapshot, domainMap: DomainMap): DomainMatch | null {
  const fromDomain = getDomain(snapshot.from_email)
  if (fromDomain && domainMap[fromDomain]) return domainMap[fromDomain]

  if (snapshot.recipients_json) {
    let recipients: unknown
    try { recipients = JSON.parse(snapshot.recipients_json) } catch { recipients = [] }
    if (Array.isArray(recipients)) {
      for (const email of recipients) {
        const domain = getDomain(email)
        if (domain && domainMap[domain]) return domainMap[domain]
      }
    }
  }
  return null
}

/**
 * SQL ORDER BY clause for the assessment sort keys. Safe (no interpolation of
 * user input — only a fixed allowlist of columns/directions).
 * @param sort  urgency | criticality | resolution | received
 * @param dir   asc | desc
 */
export function orderByClause(sort: string | null | undefined, dir: string | null | undefined): string {
  const direction = String(dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const ratingCase = (col: string) => `CASE ${col} WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END`
  const bucketCase = `CASE resolution_bucket WHEN '<1h' THEN 1 WHEN '1-4h' THEN 2 WHEN '1d' THEN 3 WHEN 'multi-day' THEN 4 ELSE 0 END`
  switch (String(sort).toLowerCase()) {
    case 'criticality': return `${ratingCase('criticality')} ${direction}, received_at DESC`
    case 'resolution':  return `${bucketCase} ${direction}, received_at DESC`
    case 'received':    return `received_at ${direction}`
    case 'urgency':     return `${ratingCase('urgency')} ${direction}, received_at DESC`
    default:            return `${ratingCase('urgency')} DESC, received_at DESC`
  }
}
