import { requireAdminUser } from '../lib/authz'
import { parsePagination } from '../lib/pagination'
import { readJson, requireString, optString, badRequestResponse } from '../lib/validate'
import type { Ctx } from '../lib/types'
import type { InvitationRow } from '../../shared/types'

function nanoid(len = 21): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  for (const byte of arr) id += chars[byte % chars.length]
  return id
}

interface InvitationListRow extends InvitationRow {
  createdByEmail: string | null
  clientName: string | null
}

export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  const url = new URL(request.url)
  const { limit, offset } = parsePagination(url)

  // Join to get a reliable client slug (we keep the denormalized column populated only for the NOT NULL constraint).
  const { results } = await env.ddsr_dashboard.prepare(
    `SELECT i.*, u.email as createdByEmail, c.slug as clientSlug, c.name as clientName
     FROM invitations i
     LEFT JOIN user u ON u.id = i.createdBy
     LEFT JOIN clients c ON c.id = i.client_id
     ORDER BY i.expiresAt DESC
     LIMIT ? OFFSET ?`
  ).bind(limit, offset).all<InvitationListRow>()
  return Response.json(results)
}

export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  let targetSlug: string
  let email: string | null
  let personIds: number[]
  try {
    const body = await readJson(request)
    targetSlug = requireString(body, 'slug')
    email = optString(body, 'email')
    const rawPersonIds = (body as { personIds?: unknown }).personIds
    personIds = Array.isArray(rawPersonIds)
      ? rawPersonIds.map(Number).filter((n) => Number.isFinite(n))
      : []
  } catch (err) {
    return badRequestResponse(err)
  }

  const client = await env.ddsr_dashboard
    .prepare('SELECT id FROM clients WHERE slug = ? LIMIT 1')
    .bind(targetSlug)
    .first<{ id: number }>()

  if (!client) {
    return Response.json({ error: 'Client not found' }, { status: 404 })
  }

  const now = Date.now()
  const expires = now + 7 * 24 * 60 * 60 * 1000 // 7 days
  const createdInvites: Array<{ personId: number; email: string; token: string; url: string }> = []

  // Bulk invite from People directory (preferred flow)
  if (Array.isArray(personIds) && personIds.length > 0) {
    // Fetch all candidate people in ONE query instead of a per-person SELECT (N+1).
    const placeholders = personIds.map(() => '?').join(', ')
    const { results: people } = await env.ddsr_dashboard
      .prepare(
        `SELECT id, email FROM people
         WHERE id IN (${placeholders})
           AND project_id IN (SELECT id FROM projects WHERE client_id = ?)`
      )
      .bind(...personIds, client.id)
      .all<{ id: number; email: string | null }>()

    const origin = new URL(request.url).origin
    const invitedAt = new Date().toISOString()
    const statements = []

    for (const person of people) {
      if (!person.email) continue

      const id = nanoid()
      const token = nanoid(32)

      // We still write clientSlug on the invitations row to satisfy the historical NOT NULL constraint.
      // All access logic uses client_id. The denormalized string on invitations is now only for display.
      statements.push(
        env.ddsr_dashboard.prepare(
          `INSERT INTO invitations (id, token, clientSlug, client_id, createdBy, email, expiresAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, token, targetSlug, client.id, admin.id, person.email, expires),
        env.ddsr_dashboard.prepare(
          `UPDATE people SET invited_at = ?, invited_by = ? WHERE id = ?`
        ).bind(invitedAt, admin.id, person.id)
      )

      createdInvites.push({
        personId: person.id,
        email: person.email,
        token,
        url: `${origin}/invite?token=${token}`
      })
    }

    // Atomic single round-trip for all invitation inserts + people updates.
    if (statements.length > 0) {
      await env.ddsr_dashboard.batch(statements)
    }

    return Response.json({ invites: createdInvites }, { status: 201 })
  }

  // Legacy single-email invite flow
  if (!email) {
    return Response.json({ error: 'email or personIds is required' }, { status: 400 })
  }

  const id = nanoid()
  const token = nanoid(32)

  // Historical NOT NULL on clientSlug column forces us to keep populating it for now.
  await env.ddsr_dashboard.prepare(
    `INSERT INTO invitations (id, token, clientSlug, client_id, createdBy, email, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, token, targetSlug, client.id, admin.id, email, expires).run()

  const origin = new URL(request.url).origin
  return Response.json({ token, url: `${origin}/invite?token=${token}` }, { status: 201 })
}
