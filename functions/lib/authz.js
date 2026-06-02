import { createAuth } from './auth.js'

/**
 * Centralized authorization helpers for DDSR Dashboard.
 *
 * === Target Data Model (Clean) ===
 * - `clients` table = Organizations / Customers
 * - `user_clients` join table = Membership (which users can access which clients)
 * - Internal team = Users with `isAdmin = true` OR email ending in @datadrivensr.com
 *   These users bypass all client restrictions and can access everything.
 *
 * External users must have at least one row in `user_clients` for a client
 * in order to access that client's projects, tasks, meetings, etc.
 *
 * The old `clientSlug` column on the `user` table is completely removed from
 * the access model (no longer selected, written, or used for decisions).
 */

const ADMIN_EMAIL_DOMAIN = '@datadrivensr.com'

/**
 * Returns the session or null. Does NOT throw.
 */
export async function getSession(request, env) {
  try {
    const auth = createAuth(env)
    const session = await auth.api.getSession({ headers: request.headers })
    return session || null
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
export async function requireSession(request, env) {
  const session = await getSession(request, env)
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}

/**
 * True if user is admin (explicit flag OR datadrivensr.com email).
 */
export function isAdmin(user) {
  if (!user) return false
  if (user.isAdmin) return true
  if (typeof user.email === 'string' && user.email.endsWith(ADMIN_EMAIL_DOMAIN)) return true
  return false
}

/**
 * Requires admin. Returns Response on failure.
 */
export function requireAdmin(sessionOrUser) {
  const user = sessionOrUser?.user || sessionOrUser
  if (!isAdmin(user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

/**
 * Convenience: returns the current user if admin, otherwise returns a 403 Response.
 * Useful for quick admin-only route guards.
 */
export async function requireAdminUser(request, env) {
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
export async function getUserClientIds(userId, env) {
  if (!userId || !env?.ddsr_dashboard) return []

  try {
    const { results } = await env.ddsr_dashboard
      .prepare('SELECT client_id FROM user_clients WHERE user_id = ?')
      .bind(userId)
      .all()

    return results.map(r => r.client_id)
  } catch (e) {
    // Table doesn't exist yet (migration not applied in prod)
    console.warn('[authz] user_clients table missing:', e.message)
    return []
  }
}

/**
 * Returns the list of client slugs the user has access to.
 * This is the single source of truth for regular user access (via user_clients join table).
 */
export async function getUserAccessibleClientSlugs(userId, env) {
  const ids = await getUserClientIds(userId, env)

  if (ids.length === 0) {
    return []
  }

  try {
    const placeholders = ids.map(() => '?').join(',')
    const { results } = await env.ddsr_dashboard
      .prepare(`SELECT slug FROM clients WHERE id IN (${placeholders})`)
      .bind(...ids)
      .all()
    return results.map(r => r.slug)
  } catch {
    return []
  }
}

/**
 * Check if a user has access to a specific client.
 * Returns true for internal admins regardless of membership.
 */
export async function userHasAccessToClient(user, clientIdentifier, env) {
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
    .first()

  return client ? clientIds.includes(client.id) : false
}

/**
 * Resolve a project identifier (slug or id) to rich client information.
 */
export async function getProjectClient(env, { slug, projectId }) {
  const db = env.ddsr_dashboard
  let project = null

  if (slug) {
    project = await db
      .prepare('SELECT id, slug, client_id FROM projects WHERE slug = ? AND is_active = 1 LIMIT 1')
      .bind(slug)
      .first()
  } else if (projectId) {
    project = await db
      .prepare('SELECT id, slug, client_id FROM projects WHERE id = ? LIMIT 1')
      .bind(projectId)
      .first()
  }

  if (!project) return null

  let clientSlug = null
  let clientId = project.client_id || null

  if (clientId) {
    const client = await db
      .prepare('SELECT id, slug FROM clients WHERE id = ? LIMIT 1')
      .bind(clientId)
      .first()

    if (client) {
      clientSlug = client.slug
      clientId = client.id
    }
  }

  return {
    projectId: project.id,
    clientId,
    clientSlug,
    project,
  }
}

/**
 * Main authorization check: Can this user access this project?
 *
 * Rules:
 * - Internal admins (isAdmin) can access everything.
 * - Regular users must have a membership row in user_clients for the project's client.
 */
export async function canAccessProject(user, projectInfo, env) {
  if (isAdmin(user)) return true
  if (!user?.id || !projectInfo?.clientId) return false

  const clientIds = await getUserClientIds(user.id, env)
  return clientIds.includes(projectInfo.clientId)
}

/**
 * Requires that the user can access the project identified by slug or projectId.
 * Returns null on success, or a Response (401/403/404) on failure.
 */
export async function requireProjectAccess(request, env, { slug, projectId }) {
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

  // Attach useful data for the handler
  return { session, projectInfo: info }
}

/**
 * Resolves the project_id for a meeting_note via its topic.
 * Returns the project_id or null if not found.
 */
export async function getMeetingProjectIdByTopic(env, topicId) {
  if (!topicId) return null;
  const row = await env.ddsr_dashboard
    .prepare(`
      SELECT m.project_id 
      FROM meeting_topics mt
      JOIN meetings m ON m.id = mt.meeting_id
      WHERE mt.id = ?
    `)
    .bind(topicId)
    .first();
  return row?.project_id ?? null;
}

/**
 * Resolves the project_id for a meeting_action_item via its topic.
 */
export async function getMeetingProjectIdByActionItem(env, actionItemId) {
  if (!actionItemId) return null;
  const row = await env.ddsr_dashboard
    .prepare(`
      SELECT m.project_id 
      FROM meeting_action_items mai
      JOIN meeting_topics mt ON mt.id = mai.topic_id
      JOIN meetings m ON m.id = mt.meeting_id
      WHERE mai.id = ?
    `)
    .bind(actionItemId)
    .first();
  return row?.project_id ?? null;
}
