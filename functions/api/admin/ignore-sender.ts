import { requireAdminUser } from '../../lib/authz'
import { readJson, optString, badRequestResponse } from '../../lib/validate'
import type { Ctx } from '../../lib/types'

// POST /api/admin/ignore-sender  { sender, reason? }
// Blocks a sender: adds it to ignore_rules (type='sender') so the worker skips
// it before evaluation, and resolves that sender's existing open snapshots so
// they drop out of the Review views. Idempotent.
export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  let sender: string | undefined
  let reason: string | null
  try {
    const body = await readJson(request)
    sender = optString(body, 'sender')?.toLowerCase()
    reason = optString(body, 'reason')
  } catch (err) {
    return badRequestResponse(err)
  }

  if (!sender || !sender.includes('@')) {
    return Response.json({ error: 'A valid sender email is required' }, { status: 400 })
  }

  const db = env.ddsr_dashboard

  // Insert the ignore rule only if it isn't already present (ignore_rules has no
  // unique constraint, so guard against duplicates explicitly).
  const existing = await db.prepare(
    "SELECT id FROM ignore_rules WHERE type = 'sender' AND lower(value) = ? LIMIT 1"
  ).bind(sender).first<{ id: number }>()

  if (!existing) {
    await db.prepare(
      "INSERT INTO ignore_rules (type, value, reason) VALUES ('sender', ?, ?)"
    ).bind(sender, reason ?? 'Blocked from Review page').run()
  }

  // Resolve this sender's existing open snapshots so they leave the views.
  const { meta } = await db.prepare(
    'UPDATE email_snapshots SET resolved_at = ? WHERE lower(from_email) = ? AND resolved_at IS NULL'
  ).bind(new Date().toISOString(), sender).run()

  return Response.json({ ok: true, blocked: sender, already_blocked: !!existing, snapshots_resolved: meta.changes ?? 0 })
}

// DELETE /api/admin/ignore-sender  { sender }  — unblock a previously blocked sender.
export async function onRequestDelete({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  let sender: string | undefined
  try {
    const body = await readJson(request)
    sender = optString(body, 'sender')?.toLowerCase()
  } catch (err) {
    return badRequestResponse(err)
  }

  if (!sender) return Response.json({ error: 'sender is required' }, { status: 400 })

  const db = env.ddsr_dashboard
  const { meta } = await db.prepare(
    "DELETE FROM ignore_rules WHERE type = 'sender' AND lower(value) = ?"
  ).bind(sender).run()

  return Response.json({ ok: true, unblocked: sender, removed: meta.changes ?? 0 })
}

// GET /api/admin/ignore-sender — list blocked senders.
export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  const db = env.ddsr_dashboard
  const { results } = await db.prepare(
    "SELECT value AS sender, reason FROM ignore_rules WHERE type = 'sender' ORDER BY value"
  ).all<{ sender: string; reason: string | null }>()

  return Response.json({ senders: results })
}
