/**
 * Slug helpers.
 *
 * The app routes (`/:slug/...`) share a single URL namespace between two
 * entities: clients and projects. To keep that namespace unambiguous, slugs
 * must be globally unique across BOTH tables, not just within each one.
 */
import type { Env } from './types'

// Lowercase, digits, single hyphens between segments. No leading/trailing hyphen.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length > 0 && slug.length <= 64 && SLUG_RE.test(slug)
}

export interface SlugExclusions {
  exceptClientId?: number | null
  exceptProjectId?: number | null
}

/**
 * Returns true if the slug is already taken by a client or a project.
 * Pass exceptClientId / exceptProjectId to exclude the row being edited.
 */
export async function slugTaken(
  env: Env,
  slug: string,
  { exceptClientId = null, exceptProjectId = null }: SlugExclusions = {},
): Promise<boolean> {
  const db = env.ddsr_dashboard

  const clientRow = await db
    .prepare(
      exceptClientId != null
        ? 'SELECT id FROM clients WHERE slug = ? AND id != ? LIMIT 1'
        : 'SELECT id FROM clients WHERE slug = ? LIMIT 1',
    )
    .bind(...(exceptClientId != null ? [slug, exceptClientId] : [slug]))
    .first()
  if (clientRow) return true

  const projectRow = await db
    .prepare(
      exceptProjectId != null
        ? 'SELECT id FROM projects WHERE slug = ? AND id != ? LIMIT 1'
        : 'SELECT id FROM projects WHERE slug = ? LIMIT 1',
    )
    .bind(...(exceptProjectId != null ? [slug, exceptProjectId] : [slug]))
    .first()
  if (projectRow) return true

  return false
}
