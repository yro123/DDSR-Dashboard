import { requireSession, requireAdminUser } from '../../lib/authz'
import { routeParam } from '../../lib/types'
import type { Ctx } from '../../lib/types'
import type { InvitationRow } from '../../../shared/types'

interface InvitationWithSlug extends InvitationRow {
  resolvedSlug: string | null
}

export async function onRequestGet({ env, params }: Ctx): Promise<Response> {
  const token = routeParam(params, 'token')
  const invite = await env.ddsr_dashboard.prepare(
    `SELECT i.*, c.slug as resolvedSlug
     FROM invitations i
     LEFT JOIN clients c ON c.id = i.client_id
     WHERE i.token = ?`
  ).bind(token).first<InvitationWithSlug>()

  if (!invite) return Response.json({ error: 'Invalid invite link' }, { status: 404 })
  if (invite.usedAt) return Response.json({ error: 'This invite has already been used' }, { status: 410 })
  if (Date.now() > invite.expiresAt) return Response.json({ error: 'This invite has expired' }, { status: 410 })

  // Return a reliable slug derived from client_id when possible.
  return Response.json({ clientSlug: invite.resolvedSlug || invite.clientSlug, email: invite.email })
}

export async function onRequestPost({ env, params, request }: Ctx): Promise<Response> {
  const token = routeParam(params, 'token')
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const invite = await env.ddsr_dashboard.prepare(
    'SELECT * FROM invitations WHERE token = ?'
  ).bind(token).first<InvitationRow>()

  if (!invite) return Response.json({ error: 'Invalid invite link' }, { status: 404 })
  if (invite.usedAt) return Response.json({ error: 'Already used' }, { status: 410 })
  if (Date.now() > invite.expiresAt) return Response.json({ error: 'Expired' }, { status: 410 })

  // Bind the invite to its intended recipient: a targeted invite (one with an
  // email) can only be redeemed by an account whose email matches. Without this,
  // anyone who obtains the token link could join the client as themselves.
  if (
    invite.email &&
    invite.email.toLowerCase() !== (session.user.email || '').toLowerCase()
  ) {
    return Response.json(
      { error: 'This invite was issued to a different email address. Sign in as that user to accept it.' },
      { status: 403 },
    )
  }

  const now = Date.now()
  const nowIso = new Date().toISOString()

  // client_id is authoritative. The old clientSlug column on the invite row is ignored for access.
  const clientId = invite.client_id

  // Resolve an optional people-directory record to link (best-effort enrichment).
  let personId: number | null = null
  if (invite.email && clientId) {
    const person = await env.ddsr_dashboard
      .prepare(`
        SELECT p.id FROM people p
        JOIN projects pr ON pr.id = p.project_id
        WHERE LOWER(p.email) = LOWER(?) AND pr.client_id = ? AND p.user_id IS NULL
        LIMIT 1
      `)
      .bind(invite.email, clientId)
      .first<{ id: number }>()
    personId = person?.id ?? null
  }

  // Apply membership grant, people-link, and "used" marking atomically so we
  // never mark an invite consumed without also granting the access it conveys.
  const statements = []
  if (clientId) {
    statements.push(
      env.ddsr_dashboard.prepare(`
        INSERT OR IGNORE INTO user_clients (user_id, client_id, role, created_at, updated_at)
        VALUES (?, ?, 'member', ?, ?)
      `).bind(session.user.id, clientId, nowIso, nowIso),
    )
  }
  if (personId) {
    statements.push(
      env.ddsr_dashboard.prepare('UPDATE people SET user_id = ?, updated_at = ? WHERE id = ?')
        .bind(session.user.id, nowIso, personId),
    )
  }
  statements.push(
    env.ddsr_dashboard.prepare('UPDATE invitations SET usedAt = ?, usedBy = ? WHERE token = ?')
      .bind(now, session.user.id, token),
  )
  await env.ddsr_dashboard.batch(statements)

  // Resolve a nice slug for the frontend success redirect / display
  let resolvedSlug: string | null = null
  if (clientId) {
    const c = await env.ddsr_dashboard.prepare('SELECT slug FROM clients WHERE id = ?').bind(clientId).first<{ slug: string }>()
    resolvedSlug = c?.slug ?? null
  }

  return Response.json({ clientSlug: resolvedSlug, clientId })
}

export async function onRequestDelete({ env, params, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  await env.ddsr_dashboard.prepare(
    'DELETE FROM invitations WHERE token = ?'
  ).bind(routeParam(params, 'token')).run()
  return Response.json({ deleted: true })
}
