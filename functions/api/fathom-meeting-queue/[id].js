// This route has been moved to /api/admin/fathom-meeting-queue/[id] (admin only).
// Old path now returns 404 for all methods.
//
// The active implementation lives at functions/api/admin/fathom-meeting-queue/[id].js.
// The previous implementation that used to live here was removed; do not re-add
// logic to this file — it exists only to 404 the legacy public path.

export async function onRequestGet() {
  return Response.json({ error: 'Moved to /api/admin/fathom-meeting-queue' }, { status: 404 })
}

export async function onRequestPut() {
  return Response.json({ error: 'Moved to /api/admin/fathom-meeting-queue' }, { status: 404 })
}

export async function onRequestDelete() {
  return Response.json({ error: 'Moved to /api/admin/fathom-meeting-queue' }, { status: 404 })
}
