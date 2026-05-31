import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins'

// PBKDF2 password hashing via Web Crypto — runs on hardware in Cloudflare Workers,
// avoids the CPU time limit that bcrypt (pure-JS) exceeds (Error 1102).
const PBKDF2_ITERS = 100_000
const PBKDF2_KEY_BYTES = 32

async function hashPassword(password) {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERS },
    key, PBKDF2_KEY_BYTES * 8,
  )
  const saltB64 = btoa(String.fromCharCode(...salt))
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(bits)))
  return `pbkdf2:sha256:${PBKDF2_ITERS}:${saltB64}:${hashB64}`
}

async function verifyPassword({ hash, password }) {
  if (!hash?.startsWith('pbkdf2:')) return false
  const [, , itersStr, saltB64, storedB64] = hash.split(':')
  const enc = new TextEncoder()
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: parseInt(itersStr, 10) },
    key, PBKDF2_KEY_BYTES * 8,
  )
  const computed = atob(btoa(String.fromCharCode(...new Uint8Array(bits))))
  const stored = atob(storedB64)
  if (computed.length !== stored.length) return false
  // timing-safe compare
  let diff = 0
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ stored.charCodeAt(i)
  return diff === 0
}

export function createAuth(env) {
  return betterAuth({
    database: env.ddsr_dashboard,
    emailAndPassword: {
      enabled: true,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    user: {
      additionalFields: {
        clientSlug: { type: 'string',  required: false, defaultValue: null },
        isAdmin:    { type: 'boolean', required: false, defaultValue: false },
      },
    },
    databaseHooks: {
      session: {
        create: {
          async after(session) {
            if (!env?.ddsr_dashboard) return
            try {
              const user = await env.ddsr_dashboard
                .prepare('SELECT id, email, clientSlug FROM "user" WHERE id = ? LIMIT 1')
                .bind(session.userId)
                .first()

              if (!user?.email || !user?.clientSlug) return

              const person = await env.ddsr_dashboard
                .prepare(`
                  SELECT pe.id, pe.user_id FROM people pe
                  JOIN projects pr ON pr.id = pe.project_id
                  WHERE LOWER(pe.email) = LOWER(?) AND pr.slug = ?
                  LIMIT 1
                `)
                .bind(user.email, user.clientSlug)
                .first()

              if (!person || person.user_id === user.id) return

              await env.ddsr_dashboard
                .prepare('UPDATE people SET user_id = ?, updated_at = ? WHERE id = ?')
                .bind(user.id, new Date().toISOString(), person.id)
                .run()
            } catch (err) {
              console.error('[auth hook] people link failed:', err)
            }
          },
        },
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          if (!env.RESEND_API_KEY) return // skip in local dev without key
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'DDSR Dashboard <noreply@datadrivensr.com>',
              to: [email],
              subject: 'Your sign-in link for DDSR Dashboard',
              html: `<p>Click <a href="${url}">here</a> to sign in to DDSR Dashboard.</p><p>This link expires in 1 hour.</p>`,
              text: `Sign in to DDSR Dashboard: ${url}`,
            }),
          })
        },
      }),
    ],
    trustedOrigins: [
      'http://localhost:5173',
      'https://ddsr-dashboard.pages.dev',
      'https://dashboards.datadrivensr.com',
    ],
    session: { cookieCache: { enabled: true } },
    secret: env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production',
  })
}
