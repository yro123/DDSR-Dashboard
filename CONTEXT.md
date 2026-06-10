# Project Context (Shared Across All Models)

## Overview / Main Goal
[Describe your project goal here]

## Current Status
- Phase: TypeScript migration (complete); admin cross-project reassignment of tasks & meetings
- Admin reassignment (2026-06-08): admins can move a task or meeting to another
  project via a "Project" dropdown in the edit forms (Tasks page, Meetings page,
  admin Meetings tab). Backend PUTs (`tasks/[id]`, `meetings/[id]`) accept
  `project_id`, gate the change behind isAdmin, validate the target exists, and —
  for tasks — clear assignee_id/workflow_id (both project-scoped). Meeting children
  (topics/notes/actions) follow via FK.
- TypeScript migration (2026-06-07): the entire app was converted JS→TS.
  - All 81 source files converted: `functions/**` → `.ts`, `src/**` → `.ts/.tsx`. No `.js/.jsx` source remains (config files `vite.config.js`/`eslint.config.js` stay JS).
  - Shared, runtime-neutral types in `shared/types.ts` (branded `ProjectSlug`/`ClientSlug`, all D1 row types from migrations, API DTOs, request-body types). Backend-only types (`Env`, `Ctx`, route-param helper) in `functions/lib/types.ts`.
  - Two tsconfigs: `tsconfig.json` (SPA, DOM lib) + `tsconfig.functions.json` (Workers, `@cloudflare/workers-types`). Shared types neutral, included by both.
  - Scripts: `npm run typecheck` (both projects, 0 errors), `npm test` (`node --test`, type-stripping — 10 passing smoke tests on slug/validate boundary), `npm run lint`.
  - Runtime validation helpers added in `functions/lib/validate.ts` (typed `request.json()` is a compile-time fiction; use these for new mutation endpoints).
  - **Bug fixed during migration**: `PUT /api/projects/:slug` passed the `{session,projectInfo}` wrapper to `requireAdmin` (which reads `.user`), so it always 403'd — project-settings save was broken for everyone. Now passes `access.session`.
  - ENV CAVEAT (WSL): `pnpm install` is broken here (virtual-store mismatch) and `vite build` fails on a missing rolldown Linux native binary — both pre-existing, unrelated to TS. `typescript`+`@cloudflare/workers-types` are symlinked from `../email-task-worker/node_modules` so `tsc` runs; a real `pnpm install` will materialize them (they're in devDependencies). TS-aware ESLint (`typescript-eslint`) is a follow-up that needs an install; until then `tsc --noEmit` is the static-check net.
- Key Decisions:
  - `:slug` in app routes (`/:slug/{tasks,hub,meetings,...}`) is **PROJECT-scoped only**.
    The backend already enforces this (all project-scoped APIs resolve `slug` against
    the `projects` table). The frontend must never navigate using a *client* slug.
    Confirmed independently by Grok + Codex review (2026-06-07).
  - Rejected the `/:clientSlug/:projectSlug/…` two-segment route migration as overkill:
    the backend is already project-scoped, so a route restructure adds risk with no gain.
  - Client-scoped operations (invitations, user_clients membership) legitimately use
    *client* slugs — these are NOT changed to project slugs.
- Open Questions / Blockers:
  - Empty-state UX for a client with zero projects: admins → /admin; regular users →
    inline "No projects yet" screen (do NOT route to /<clientSlug>/tasks, which 404s).

## Architecture & Design
- Tech stack: TypeScript throughout. React + React Router (Vite SPA) frontend;
  Cloudflare Pages Functions (`functions/api/**`) backend over D1 (SQLite). Auth via
  better-auth (`functions/lib/auth.ts`).
- Key patterns:
  - Two slug-bearing entities: `clients` (organizations) and `projects` (belong to a client).
  - `ProjectContext` exposes `current` = current PROJECT (by URL slug), and
    `currentClient` = that project's client. `:slug` is always a project slug.
  - Access control via `user_clients` join table; admins = `isAdmin` or @datadrivensr.com.
  - Slugs must be globally unique across clients AND projects (shared URL namespace),
    validated by `functions/lib/slug.ts` on create and edit.
- Non-goals:
  - Multi-project-in-URL routing (see rejected decision above).

## Coding Standards
- TypeScript, strict mode. Backend handlers: `export async function onRequestX({ env, request, params }: Ctx)`.
  Coerce route params with `routeParam(params, 'id')` (they're `string | string[]`).
- D1 rows: use shared row types as `.first<TaskRow>()` / `.all<TaskRow>()`. Keep raw SQL; no ORM.
- Validate mutation bodies at runtime (`functions/lib/validate.ts`) — TS types on `request.json()` are not runtime guarantees.
- Relative imports are extensionless (resolved by Vite/esbuild). Note: Node's native loader does not, which limits `node --test` to dependency-light modules.

Last updated: Mon Jun  8 2026 (admin cross-project reassignment of tasks & meetings)
