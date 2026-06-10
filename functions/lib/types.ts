/**
 * Backend-only types for the Cloudflare Pages Functions runtime.
 * Safe to use `D1Database`, `EventContext`, etc. here (Workers lib).
 * Do NOT import this from frontend code — use `shared/types.ts` for shared shapes.
 */
import type { AuthSession } from '../../shared/types'

/** Cloudflare environment bindings + secrets available to Pages Functions. */
export interface Env {
  /** D1 binding name as configured in wrangler (see existing handlers). */
  ddsr_dashboard: D1Database
  // Secrets / vars (all optional at the type level; presence checked at runtime).
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  RESEND_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  [key: string]: unknown
}

/** Per-request data attached by `functions/_middleware.ts`. */
export interface RequestData {
  session?: AuthSession
  [key: string]: unknown
}

/**
 * Standard handler context. Pages Functions route params are always strings at
 * runtime; we type them as a string record and coerce with `routeParam()` to
 * avoid the `string | string[]` noise from the default `Params` type.
 */
export type Ctx<P extends string = string> = EventContext<Env, P, RequestData>

/** Read a single route param as a string (Pages gives `string | string[]`). */
export function routeParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = params[key]
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}
