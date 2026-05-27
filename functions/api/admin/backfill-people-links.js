import { createAuth } from '../../lib/auth'

const isAdminUser = u => !!(u?.isAdmin) || u?.email?.endsWith('@datadrivensr.com')

export async function onRequestPost({ env, request }) {
  const auth = createAuth(env)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!isAdminUser(session?.user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const unlinked = await env.ddsr_dashboard
    .prepare('SELECT id, email, project_id FROM people WHERE user_id IS NULL AND email IS NOT NULL')
    .all()

  let linked = 0
  const now = new Date().toISOString()

  for (const person of unlinked.results) {
    const user = await env.ddsr_dashboard
      .prepare(`
        SELECT u.id FROM "user" u
        JOIN projects p ON p.slug = u.clientSlug
        WHERE LOWER(u.email) = LOWER(?) AND p.id = ?
        LIMIT 1
      `)
      .bind(person.email, person.project_id)
      .first()

    if (user) {
      await env.ddsr_dashboard
        .prepare('UPDATE people SET user_id = ?, updated_at = ? WHERE id = ?')
        .bind(user.id, now, person.id)
        .run()
      linked++
    }
  }

  return Response.json({ linked, skipped: unlinked.results.length - linked })
}
