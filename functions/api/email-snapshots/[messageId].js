export async function onRequestGet({ env, params }) {
  const snapshot = await env.ddsr_dashboard
    .prepare('SELECT * FROM email_snapshots WHERE message_id = ?')
    .bind(params.messageId)
    .first();

  if (!snapshot) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(snapshot);
}
