// This route has been moved to /api/admin/fathom-meeting-queue (admin only).
// Old path now returns 404.

export async function onRequestGet(): Promise<Response> {
  return Response.json({ error: 'Moved to /api/admin/fathom-meeting-queue' }, { status: 404 })
}

export async function onRequestPut(): Promise<Response> {
  return Response.json({ error: 'Moved to /api/admin/fathom-meeting-queue' }, { status: 404 })
}

export async function onRequestDelete(): Promise<Response> {
  return Response.json({ error: 'Moved to /api/admin/fathom-meeting-queue' }, { status: 404 })
}
