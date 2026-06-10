import { requireSession, requireProjectAccess } from '../../lib/authz'
import { routeParam } from '../../lib/types'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'
import type { Ctx } from '../../lib/types'
import type { DocumentRow } from '../../../shared/types'

export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const doc = await env.ddsr_dashboard.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first<DocumentRow>()
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId: doc.project_id })
  if (access instanceof Response) return access

  let workflow_id: number | null
  let name: string | null
  let url: string | null
  let doc_type: string | null
  try {
    const body = await readJson(request)
    workflow_id = optNumber(body, 'workflow_id')
    name = optString(body, 'name')
    url = optString(body, 'url')
    doc_type = optString(body, 'doc_type')
  } catch (err) {
    return badRequestResponse(err)
  }
  const now = new Date().toISOString()

  await env.ddsr_dashboard.prepare(`
    UPDATE documents SET workflow_id = ?, name = ?, url = ?, doc_type = ?, updated_at = ?
    WHERE id = ?
  `).bind(workflow_id || null, name || null, url || null, doc_type || null, now, id).run()

  const updated = await env.ddsr_dashboard.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first<DocumentRow>()
  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(updated)
}

export async function onRequestDelete({ env, params, request }: Ctx): Promise<Response> {
  const id = routeParam(params, 'id')
  const doc = await env.ddsr_dashboard.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first<DocumentRow>()
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })

  const access = await requireProjectAccess(request, env, { projectId: doc.project_id })
  if (access instanceof Response) return access

  await env.ddsr_dashboard.prepare('UPDATE documents SET is_active = 0 WHERE id = ?').bind(id).run()
  return Response.json({ deleted: true })
}
