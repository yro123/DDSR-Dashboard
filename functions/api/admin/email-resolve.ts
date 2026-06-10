import { requireAdminUser } from '../../lib/authz'
import { readJson, optString, badRequestResponse } from '../../lib/validate'
import type { Ctx } from '../../lib/types'

// POST /api/admin/email-resolve  { message_id, scope?: 'thread' | 'message' }
// Marks an email (or its whole thread) resolved so it drops out of the
// Needs Attention view. Default scope: 'thread'.
export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  let message_id: string | null
  let scope: string
  try {
    const body = await readJson(request)
    message_id = optString(body, 'message_id')
    scope = optString(body, 'scope') ?? 'thread'
  } catch (err) {
    return badRequestResponse(err)
  }

  if (!message_id) {
    return Response.json({ error: 'message_id is required' }, { status: 400 })
  }

  const db = env.ddsr_dashboard
  const now = new Date().toISOString()

  if (scope === 'thread') {
    // Resolve every snapshot sharing this one's thread_id (one click clears the
    // whole conversation). Falls back to the single message if it has no thread.
    const row = await db.prepare('SELECT thread_id FROM email_snapshots WHERE message_id = ?')
      .bind(message_id).first<{ thread_id: string | null }>()
    const threadId = row?.thread_id
    if (threadId) {
      const { meta } = await db.prepare(
        'UPDATE email_snapshots SET resolved_at = ? WHERE thread_id = ? AND resolved_at IS NULL'
      ).bind(now, threadId).run()
      return Response.json({ ok: true, resolved: meta.changes ?? 0, scope: 'thread' })
    }
  }

  const { meta } = await db.prepare(
    'UPDATE email_snapshots SET resolved_at = ? WHERE message_id = ? AND resolved_at IS NULL'
  ).bind(now, message_id).run()
  return Response.json({ ok: true, resolved: meta.changes ?? 0, scope: 'message' })
}
