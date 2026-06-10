import { requireAdminUser } from '../lib/authz'
import type { Ctx } from '../lib/types'

function firstWord(name: string | null | undefined): string {
  return (name || '').trim().split(/\s+/)[0].toLowerCase()
}

interface SenderRow {
  from_name: string
  from_email: string
  email_count: number
}

interface CandidatePersonRow {
  id: number
  name: string
  email: string | null
  role: string | null
  org_type: string | null
  avatar_bg: string | null
  avatar_fg: string | null
  is_active: number
  user_id: string | null
  project_id: number
  project_name: string | null
  client_name: string | null
}

interface CandidateProjectRow {
  id: number
  name: string
  client_display_name: string
}

export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const db = env.ddsr_dashboard

  const [{ results: senders }, { results: people }, { results: projects }] = await Promise.all([
    db.prepare(`
      SELECT from_name, from_email, COUNT(*) as email_count
      FROM email_snapshots
      WHERE from_email IS NOT NULL
        AND from_name  IS NOT NULL
        AND from_name  != ''
        AND from_email NOT LIKE '%@fathom.video'
        AND from_email NOT LIKE '%@otter.ai'
        AND from_email NOT LIKE '%@fireflies.ai'
        AND from_email NOT LIKE 'noreply@%'
        AND from_email NOT LIKE 'no-reply@%'
        AND from_email NOT LIKE 'notifications@%'
        AND from_email NOT LIKE 'donotreply@%'
      GROUP BY from_email
      ORDER BY email_count DESC
      LIMIT 100
    `).all<SenderRow>(),

    db.prepare(`
      SELECT p.id, p.name, p.email, p.role, p.org_type, p.avatar_bg, p.avatar_fg,
             p.is_active, p.user_id, p.project_id,
             proj.name AS project_name,
             COALESCE(c.display_name, proj.client_display_name) AS client_name
      FROM people p
      LEFT JOIN projects proj ON proj.id = p.project_id
      LEFT JOIN clients c ON c.id = proj.client_id
      WHERE p.is_active = 1
    `).all<CandidatePersonRow>(),

    db.prepare(
      'SELECT id, name, client_display_name FROM projects WHERE is_active = 1 ORDER BY name ASC'
    ).all<CandidateProjectRow>(),
  ])

  const knownEmails  = new Set(people.filter(p => p.email).map(p => p.email!.toLowerCase()))
  const noEmailPeople = people.filter(p => !p.email)

  const partialMatches: Array<{ sender: SenderRow; person: CandidatePersonRow }> = []
  const newPeople: SenderRow[]      = []

  for (const sender of senders) {
    const senderEmail = sender.from_email.toLowerCase()
    if (knownEmails.has(senderEmail)) continue

    const match = noEmailPeople.find(p => firstWord(p.name) === firstWord(sender.from_name))
    if (match) {
      partialMatches.push({ sender, person: match })
    } else {
      newPeople.push(sender)
    }
  }

  return Response.json({ partialMatches, newPeople, projects })
}
