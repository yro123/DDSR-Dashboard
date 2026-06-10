/**
 * Smoke tests for the security / identity boundary.
 *
 * These cover the logic TypeScript can't prove correct on its own — the exact
 * surfaces behind the slug-namespace bug and the access model. Run with:
 *   npm test        (uses `node --test`, Node 22+ type-stripping; no deps)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { isValidSlug, slugTaken } from '../functions/lib/slug.ts'
import {
  asObject, requireString, optString, requireNumber, optNumber, BadRequest,
} from '../functions/lib/validate.ts'
import type { Env } from '../functions/lib/types.ts'

// NOTE: `isAdmin`/authz are intentionally not imported here. authz.ts statically
// pulls in better-auth (via ./auth), and Node's native test loader doesn't do the
// extensionless module resolution that esbuild/Cloudflare use at build time. authz
// is exercised by `npm run typecheck`; handler-level tests need a D1 mock + a
// bundler-based runner (vitest) once dependencies can be installed.

// ── isValidSlug ──────────────────────────────────────────────────────────────
test('isValidSlug accepts lowercase, digits, single hyphens', () => {
  for (const s of ['acme', 'acme-corp', 'a1', 'gourmet-nut-co']) {
    assert.equal(isValidSlug(s), true, `${s} should be valid`)
  }
})
test('isValidSlug rejects bad slugs', () => {
  for (const s of ['Acme', 'acme corp', 'acme_corp', '-acme', 'acme-', 'acme--corp', '', 'a'.repeat(65)]) {
    assert.equal(isValidSlug(s), false, `${s} should be invalid`)
  }
  assert.equal(isValidSlug(null), false)
  assert.equal(isValidSlug(123 as unknown as string), false)
})

// ── slugTaken: enforces uniqueness across BOTH clients and projects ──────────
function fakeEnv(opts: { clientHit?: boolean; projectHit?: boolean }): Env {
  const make = (table: 'clients' | 'projects') => ({
    bind: () => ({
      first: async () =>
        (table === 'clients' ? opts.clientHit : opts.projectHit) ? { id: 1 } : null,
    }),
  })
  return {
    ddsr_dashboard: {
      prepare: (sql: string) => make(sql.includes('FROM clients') ? 'clients' : 'projects'),
    },
  } as unknown as Env
}

test('slugTaken is true when a CLIENT already owns the slug', async () => {
  assert.equal(await slugTaken(fakeEnv({ clientHit: true }), 'acme'), true)
})
test('slugTaken is true when a PROJECT already owns the slug (cross-namespace)', async () => {
  assert.equal(await slugTaken(fakeEnv({ projectHit: true }), 'acme'), true)
})
test('slugTaken is false when neither table owns the slug', async () => {
  assert.equal(await slugTaken(fakeEnv({}), 'acme'), false)
})

// ── validate helpers (runtime guards for request bodies) ─────────────────────
test('requireString trims and rejects empties', () => {
  assert.equal(requireString({ name: '  acme  ' }, 'name'), 'acme')
  assert.throws(() => requireString({ name: '   ' }, 'name'), BadRequest)
  assert.throws(() => requireString({}, 'name'), BadRequest)
})
test('optString returns null for absent/empty, trims otherwise', () => {
  assert.equal(optString({}, 'x'), null)
  assert.equal(optString({ x: '' }, 'x'), null)
  assert.equal(optString({ x: ' y ' }, 'x'), 'y')
})
test('requireNumber accepts numbers and numeric strings, rejects junk', () => {
  assert.equal(requireNumber({ n: 5 }, 'n'), 5)
  assert.equal(requireNumber({ n: '7' }, 'n'), 7)
  assert.throws(() => requireNumber({ n: 'abc' }, 'n'), BadRequest)
})
test('optNumber returns null for absent', () => {
  assert.equal(optNumber({}, 'n'), null)
  assert.equal(optNumber({ n: '3' }, 'n'), 3)
})
test('asObject rejects arrays and null', () => {
  assert.throws(() => asObject(null), BadRequest)
  assert.throws(() => asObject([1, 2]), BadRequest)
  assert.deepEqual(asObject({ a: 1 }), { a: 1 })
})
