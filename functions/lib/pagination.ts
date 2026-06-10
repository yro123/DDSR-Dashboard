/**
 * Pagination helper for list endpoints.
 *
 * Adds a hard upper bound so a single request can never load an unbounded table
 * into memory. Endpoints append `LIMIT ? OFFSET ?` with these values. Clients may
 * pass `?limit=` / `?offset=`; absent → a sane default, over the cap → clamped.
 */
export interface Pagination {
  limit: number
  offset: number
}

export function parsePagination(url: URL, defaultLimit = 200, maxLimit = 500): Pagination {
  const rawLimit = Number(url.searchParams.get('limit'))
  const rawOffset = Number(url.searchParams.get('offset'))
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0
  return { limit, offset }
}
