import { requireAdminUser } from '../lib/authz'
import { parsePagination } from '../lib/pagination'
import type { Ctx } from '../lib/types'
import type { UserRow } from '../../shared/types'

interface MembershipRow {
  user_id: string
  client_id: number
  client_name: string
  client_slug: string
}

interface Membership {
  client_id: number
  client_slug: string
  client_name: string
}

type UserListRow = Pick<UserRow, 'id' | 'name' | 'email' | 'emailVerified' | 'isAdmin' | 'createdAt'>

export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const url = new URL(request.url)
  const { limit, offset } = parsePagination(url)

  const users = await env.ddsr_dashboard.prepare(
    `SELECT id, name, email, emailVerified, isAdmin, createdAt FROM user ORDER BY createdAt DESC LIMIT ? OFFSET ?`
  ).bind(limit, offset).all<UserListRow>()

  // Enrich with current memberships from the join table (the only source of truth for access)
  let membershipMap: Record<string, Membership[]> = {}

  try {
    const memberships = await env.ddsr_dashboard.prepare(`
      SELECT uc.user_id, c.id as client_id, c.name as client_name, c.slug as client_slug
      FROM user_clients uc
      JOIN clients c ON c.id = uc.client_id
    `).all<MembershipRow>()

    for (const m of memberships.results) {
      if (!membershipMap[m.user_id]) membershipMap[m.user_id] = []
      membershipMap[m.user_id].push({
        client_id: m.client_id,
        client_slug: m.client_slug,
        client_name: m.client_name,
      })
    }
  } catch (e) {
    console.warn('[users] user_clients table not found or query failed:', (e as Error).message)
    membershipMap = {}
  }

  const enriched = users.results.map(u => ({
    ...u,
    memberships: membershipMap[u.id] || [],
  }))

  return Response.json(enriched)
}
