import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins'

export function createAuth(env) {
  return betterAuth({
    database: env.ddsr_dashboard,
    emailAndPassword: { enabled: true },
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
