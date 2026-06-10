/**
 * Tiny runtime validation helpers for request bodies.
 *
 * TypeScript types on `await request.json()` are a COMPILE-TIME fiction — at
 * runtime the body is whatever the client sent. These helpers turn an untyped
 * JSON value into a typed, trimmed, validated shape (or throw `BadRequest`).
 *
 * Intentionally dependency-free (no zod) — hand-written guards keep the bundle
 * small and avoid touching the package manager.
 */

/** Thrown by validators; handlers convert it to a 400 via `badRequestResponse`. */
export class BadRequest extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadRequest'
  }
}

export function badRequestResponse(err: unknown): Response {
  const message = err instanceof BadRequest ? err.message : 'Invalid request body'
  return Response.json({ error: message }, { status: 400 })
}

type Obj = Record<string, unknown>

export function asObject(value: unknown): Obj {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequest('Expected a JSON object body')
  }
  return value as Obj
}

/**
 * Parse a request's JSON body into a plain object, throwing `BadRequest` on
 * malformed JSON or a non-object body. Handlers should catch and return
 * `badRequestResponse(err)` (a 400) instead of letting `request.json()` throw
 * an unhandled 500.
 */
export async function readJson(request: Request): Promise<Obj> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    throw new BadRequest('Invalid or missing JSON body')
  }
  return asObject(raw)
}

/** Required, non-empty (after trim) string. */
export function requireString(obj: Obj, key: string): string {
  const v = obj[key]
  if (typeof v !== 'string' || v.trim() === '') {
    throw new BadRequest(`${key} is required`)
  }
  return v.trim()
}

/** Optional string -> trimmed string or null. */
export function optString(obj: Obj, key: string): string | null {
  const v = obj[key]
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string') throw new BadRequest(`${key} must be a string`)
  return v.trim()
}

/** Required number (accepts numeric strings). */
export function requireNumber(obj: Obj, key: string): number {
  const v = obj[key]
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n !== 'number' || Number.isNaN(n)) {
    throw new BadRequest(`${key} is required and must be a number`)
  }
  return n
}

/** Optional number -> number or null. */
export function optNumber(obj: Obj, key: string): number | null {
  const v = obj[key]
  if (v === undefined || v === null || v === '') return null
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n !== 'number' || Number.isNaN(n)) {
    throw new BadRequest(`${key} must be a number`)
  }
  return n
}
