import { createAuth } from './auth'
import type { Env } from './types'
import type { AuthSession, SessionUser, ProjectRow } from '../../shared/types'

/**
 * Centralized authorization helpers for DDSR Dashboard.
 *
 * === Data Model ===
 * - `clients` table = Organizations / Customers
 * - `user_clients` join table = Membership (which users can access which clients)
 * - Internal team = Users with `isAdmin = true` OR email ending in @datadrivensr.com
 *   These users bypass all client restrictions and can access everything.
 *
 * External users must have at least one row in `user_clients` for a client
 * in order to access that client's projects, tasks, meetings, etc.
 */

/** Returns the session or null. Does NOT throw. */
export async function getSession(request: Request, env: Env): Promise<AuthSession | null> {
  try {
    const auth = createAuth(env)
    const session = await auth.api.getSession({ headers: request.headers })
    return (session as AuthSession | null) || null
  } catch (err) {
    console.error('[authz] getSession error:', err)
    return null
  }
}

/**
 * Requires an authenticated session. Returns Response on failure.
 * Usage: const session = await requireSession(...)
 * if (session instanceof Response) return session
 */
export async function requireSession(request: Request, env: Env): Promise<AuthSession | Response> {
  const session = await getSession(request, env)
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}

/**
 * True if the user is an internal admin.
 *
 * Admin is granted ONLY by the explicit `isAdmin` flag on the user row. The old
 * "any @datadrivensr.com email is admin" rule was removed: with self-service
 * signup enabled, anyone could register such an address and self-escalate.
 * Existing internal users are backfilled to isAdmin=1 via migration; new admins
 * are granted through the Users admin tab (or by setting the flag directly).
 */
export function isAdmin(user: SessionUser | null | undefined): boolean {
  return !!user?.isAdmin
}

/** Requires admin. Returns Response on failure, or null on success. */
export function requireAdmin(sessionOrUser: AuthSession | SessionUser | null | undefined): Response | null {
  const user = (sessionOrUser as AuthSession | null)?.user ?? (sessionOrUser as SessionUser | null)
  if (!isAdmin(user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

/**
 * Convenience: returns the current user if admin, otherwise returns a 403 Response.
 */
export async function requireAdminUser(request: Request, env: Env): Promise<SessionUser | Response> {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session
  const adminCheck = requireAdmin(session)
  if (adminCheck) return adminCheck
  return session.user
}

/**
 * Get all client IDs the given user has explicit access to.
 * Internal admins always return an empty array here (they bypass via isAdmin()).
 */
export async function getUserClientIds(userId: string | undefined, env: Env): Promise<number[]> {
  if (!userId || !env?.ddsr_dashboard) return []

  try {
    const { results } = await env.ddsr_dashboard
      .prepare('SELECT client_id FROM user_clients WHERE user_id = ?')
      .bind(userId)
      .all<{ client_id: number }>()

    return results.map((r) => r.client_id)
  } catch (e) {
    // Table doesn't exist yet (migration not applied in prod)
    console.warn('[authz] user_clients table missing:', (e as Error).message)
    return []
  }
}

/**
 * Returns the list of client slugs the user has access to.
 * Single source of truth for regular user access (via user_clients join table).
 */
export async function getUserAccessibleClientSlugs(userId: string | undefined, env: Env): Promise<string[]> {
  const ids = await getUserClientIds(userId, env)
  if (ids.length === 0) return []

  try {
    const placeholders = ids.map(() => '?').join(',')
    const { results } = await env.ddsr_dashboard
      .prepare(`SELECT slug FROM clients WHERE id IN (${placeholders})`)
      .bind(...ids)
      .all<{ slug: string }>()
    return results.map((r) => r.slug)
  } catch {
    return []
  }
}

/**
 * Check if a user has access to a specific client (by numeric id or slug).
 * Returns true for internal admins regardless of membership.
 */
export async function userHasAccessToClient(
  user: SessionUser | null | undefined,
  clientIdentifier: number | string,
  env: Env,
): Promise<boolean> {
  if (isAdmin(user)) return true
  if (!user?.id) return false

  const clientIds = await getUserClientIds(user.id, env)
  if (clientIds.length === 0) return false

  if (typeof clientIdentifier === 'number') {
    return clientIds.includes(clientIdentifier)
  }

  const client = await env.ddsr_dashboard
    .prepare('SELECT id FROM clients WHERE slug = ? LIMIT 1')
    .bind(clientIdentifier)
    .first<{ id: number }>()

  return client ? clientIds.includes(client.id) : false
}

export interface ProjectClientInfo {
  projectId: number
  clientId: number | null
  clientSlug: string | null
  project: Pick<ProjectRow, 'id' | 'slug' | 'client_id'>
}

/** Resolve a project identifier (slug or id) to rich client information. */
export async function getProjectClient(
  env: Env,
  { slug, projectId }: { slug?: string; projectId?: number },
): Promise<ProjectClientInfo | null> {
  const db = env.ddsr_dashboard
  let project: Pick<ProjectRow, 'id' | 'slug' | 'client_id'> | null = null

  if (slug) {
    project = await db
      .prepare('SELECT id, slug, client_id FROM projects WHERE slug = ? AND is_active = 1 LIMIT 1')
      .bind(slug)
      .first<Pick<ProjectRow, 'id' | 'slug' | 'client_id'>>()
  } else if (projectId) {
    project = await db
      .prepare('SELECT id, slug, client_id FROM projects WHERE id = ? LIMIT 1')
      .bind(projectId)
      .first<Pick<ProjectRow, 'id' | 'slug' | 'client_id'>>()
  }

  if (!project) return null

  let clientSlug: string | null = null
  let clientId: number | null = project.client_id ?? null

  if (clientId) {
    const client = await db
      .prepare('SELECT id, slug FROM clients WHERE id = ? LIMIT 1')
      .bind(clientId)
      .first<{ id: number; slug: string }>()

    if (client) {
      clientSlug = client.slug
      clientId = client.id
    }
  }

  return { projectId: project.id, clientId, clientSlug, project }
}

/**
 * Main authorization check: Can this user access this project?
 * - Internal admins (isAdmin) can access everything.
 * - Regular users must have a membership row in user_clients for the project's client.
 */
export async function canAccessProject(
  user: SessionUser | null | undefined,
  projectInfo: ProjectClientInfo | null,
  env: Env,
): Promise<boolean> {
  if (isAdmin(user)) return true
  if (!user?.id || !projectInfo?.clientId) return false

  const clientIds = await getUserClientIds(user.id, env)
  return clientIds.includes(projectInfo.clientId)
}

export interface ProjectAccess {
  session: AuthSession
  projectInfo: ProjectClientInfo
}

/**
 * Requires that the user can access the project identified by slug or projectId.
 * Returns { session, projectInfo } on success, or a Response (401/403/404).
 */
export async function requireProjectAccess(
  request: Request,
  env: Env,
  { slug, projectId }: { slug?: string; projectId?: number },
): Promise<ProjectAccess | Response> {
  const session = await requireSession(request, env)
  if (session instanceof Response) return session

  const user = session.user
  const info = await getProjectClient(env, { slug, projectId })

  if (!info) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!(await canAccessProject(user, info, env))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { session, projectInfo: info }
}

/** Resolves the project_id for a meeting_note via its topic. */
export async function getMeetingProjectIdByTopic(env: Env, topicId: number | string | undefined): Promise<number | null> {
  if (!topicId) return null
  const row = await env.ddsr_dashboard
    .prepare(`
      SELECT m.project_id
      FROM meeting_topics mt
      JOIN meetings m ON m.id = mt.meeting_id
      WHERE mt.id = ?
    `)
    .bind(topicId)
    .first<{ project_id: number }>()
  return row?.project_id ?? null
}

/** Resolves the project_id for a meeting_action_item via its topic. */
export async function getMeetingProjectIdByActionItem(
  env: Env,
  actionItemId: number | string | undefined,
): Promise<number | null> {
  if (!actionItemId) return null
  const row = await env.ddsr_dashboard
    .prepare(`
      SELECT m.project_id
      FROM meeting_action_items mai
      JOIN meeting_topics mt ON mt.id = mai.topic_id
      JOIN meetings m ON m.id = mt.meeting_id
      WHERE mai.id = ?
    `)
    .bind(actionItemId)
    .first<{ project_id: number }>()
  return row?.project_id ?? null
}
