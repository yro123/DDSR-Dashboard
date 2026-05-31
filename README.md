# DDSR Dashboard

Internal operations dashboard for Data Driven SR.

## Tech Stack

- **Frontend**: React 19 + Vite 8, React Router v7, @dnd-kit
- **Auth**: better-auth (email/password + magic links via Resend)
- **Backend**: Cloudflare Pages + Functions (serverless)
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages

## Key Features

- Per-client task management with workflows
- Meeting notes + action items + automatic task creation
- Document hub
- Request/ticket intake
- "Needs Review" queue for low-confidence AI tasks
- Global admin panel (users, clients, config, people, etc.)
- Magic link + password authentication
- Role-based access (per-client + global admin)

## Local Development

```bash
pnpm install
pnpm dev          # Vite dev server (proxies /api to wrangler)
wrangler dev      # Functions on :8788 (in separate terminal)
```

Required environment (`.dev.vars` or wrangler secrets):

- `BETTER_AUTH_SECRET` (strong random string — required)
- `RESEND_API_KEY` (for magic links in production)

## Project Structure

```
src/
  pages/          # Main screens (Tasks, Meetings, Hub, Review, Admin...)
  context/        # ProjectContext, ConfigContext, ThemeContext
  components/
functions/
  api/            # Cloudflare Functions routes
  lib/
    auth.js       # better-auth + custom PBKDF2
    authz.js      # Centralized authorization (new)
migrations/       # D1 schema + seeds
```

## Authorization Model

- Non-admin users are tied to a single `clientSlug`
- They can only access projects belonging to their client
- Global admins (explicit flag or `@datadrivensr.com` email) can access everything
- All sensitive endpoints now enforce server-side checks (see `functions/lib/authz.js`)

## Important Notes

- Never commit `dist/`
- `BETTER_AUTH_SECRET` must be set in production (no dev fallback)
- Health check at `/api/healthz` is safe for uptime monitors

## Deployment

Cloudflare Pages (auto from Git). Make sure `wrangler.toml` has the correct D1 binding and `compatibility_flags = ["nodejs_compat"]`.
