import { requireAdminUser } from '../../lib/authz.js'

export async function onRequestGet({ env, params, request }) {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  const snapshot = await env.ddsr_dashboard
    .prepare('SELECT * FROM email_snapshots WHERE message_id = ?')
    .bind(params.messageId)
    .first();

  if (!snapshot) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(snapshot);
}
