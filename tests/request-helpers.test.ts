/**
 * Tests for the request-boundary helpers added in the hardening pass:
 * pagination clamping and JSON-body parsing.
 *
 * NOTE: handler-level authz tests (e.g. global-config admin-only, invite email
 * binding) need a D1 mock + a bundler-based runner because authz.ts statically
 * imports better-auth and the handlers use extensionless imports that Node's
 * native test loader can't resolve. Those are deferred to a vitest setup.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { parsePagination } from '../functions/lib/pagination.ts'
import { readJson, BadRequest } from '../functions/lib/validate.ts'

// ── parsePagination ──────────────────────────────────────────────────────────
test('parsePagination uses defaults when params absent', () => {
  const p = parsePagination(new URL('https://x/api/tasks'))
  assert.deepEqual(p, { limit: 200, offset: 0 })
})
test('parsePagination clamps limit to the max', () => {
  const p = parsePagination(new URL('https://x/api/tasks?limit=99999'), 200, 500)
  assert.equal(p.limit, 500)
})
test('parsePagination honors valid limit/offset', () => {
  const p = parsePagination(new URL('https://x/api/tasks?limit=50&offset=100'))
  assert.deepEqual(p, { limit: 50, offset: 100 })
})
test('parsePagination ignores junk and negatives', () => {
  const p = parsePagination(new URL('https://x/api/tasks?limit=abc&offset=-5'))
  assert.deepEqual(p, { limit: 200, offset: 0 })
})

// ── readJson ─────────────────────────────────────────────────────────────────
function jsonReq(body: string): Request {
  return new Request('https://x/api', { method: 'POST', body, headers: { 'content-type': 'application/json' } })
}

test('readJson parses a valid object body', async () => {
  const obj = await readJson(jsonReq('{"a":1,"b":"two"}'))
  assert.deepEqual(obj, { a: 1, b: 'two' })
})
test('readJson rejects malformed JSON with BadRequest (not a 500)', async () => {
  await assert.rejects(() => readJson(jsonReq('{not valid')), BadRequest)
})
test('readJson rejects a non-object (array) body', async () => {
  await assert.rejects(() => readJson(jsonReq('[1,2,3]')), BadRequest)
})
