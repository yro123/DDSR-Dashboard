import { requireAdminUser } from '../lib/authz.js'

export async function onRequestGet({ env, request }) {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const users = await env.ddsr_dashboard.prepare(
    `SELECT id, name, email, emailVerified, isAdmin, createdAt FROM user ORDER BY createdAt DESC`
  ).all()

  // Enrich with current memberships from the join table (the only source of truth for access)
  let membershipMap = {}

  try {
    const memberships = await env.ddsr_dashboard.prepare(`
      SELECT uc.user_id, c.id as client_id, c.name as client_name, c.slug as client_slug
      FROM user_clients uc
      JOIN clients c ON c.id = uc.client_id
    `).all()

    for (const m of memberships.results) {
      if (!membershipMap[m.user_id]) membershipMap[m.user_id] = []
      membershipMap[m.user_id].push({
        client_id: m.client_id,
        client_slug: m.client_slug,
        client_name: m.client_name,
      })
    }
  } catch (e) {
    console.warn('[users] user_clients table not found or query failed:', e.message)
    membershipMap = {}
  }

  const enriched = users.results.map(u => ({
    ...u,
    memberships: membershipMap[u.id] || [],
  }))

  return Response.json(enriched)
}
