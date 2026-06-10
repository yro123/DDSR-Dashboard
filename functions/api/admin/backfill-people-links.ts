import { requireAdminUser, getUserClientIds } from '../../lib/authz'
import type { Ctx } from '../../lib/types'

interface UnlinkedPersonRow {
  id: number
  email: string | null
  project_id: number
}

/**
 * Admin-only backfill: Link existing "people" records to real user accounts.
 *
 * Philosophy (clean model):
 * - `people` records are lightweight assignment/contact entities.
 * - They can exist for external people who will never have dashboard access.
 * - `user_id` on people is purely for enrichment (showing that this assignee has an account).
 * - Real access is controlled exclusively via `user` + `user_clients`.
 *
 * This script finds unlinked people with emails and links them to users
 * who have explicit membership in a client that contains that person.
 */
export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const unlinked = await env.ddsr_dashboard
    .prepare('SELECT id, email, project_id FROM people WHERE user_id IS NULL AND email IS NOT NULL')
    .all<UnlinkedPersonRow>()

  let linked = 0
  const now = new Date().toISOString()

  for (const person of unlinked.results) {
    // Find users with a matching email who have access to this person's project
    const users = await env.ddsr_dashboard
      .prepare(`
        SELECT u.id
        FROM "user" u
        WHERE LOWER(u.email) = LOWER(?)
      `)
      .bind(person.email)
      .all<{ id: string }>()

    for (const candidate of users.results) {
      const userClientIds = await getUserClientIds(candidate.id, env)

      // Check if this user has access to the project that owns this person
      const project = await env.ddsr_dashboard
        .prepare('SELECT client_id FROM projects WHERE id = ? LIMIT 1')
        .bind(person.project_id)
        .first<{ client_id: number | null }>()

      if (project && project.client_id !== null && userClientIds.includes(project.client_id)) {
        await env.ddsr_dashboard
          .prepare('UPDATE people SET user_id = ?, updated_at = ? WHERE id = ?')
          .bind(candidate.id, now, person.id)
          .run()
        linked++
        break // only link once
      }
    }
  }

  return Response.json({ linked, skipped: unlinked.results.length - linked })
}
