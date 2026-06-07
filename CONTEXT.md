# Project Context (Shared Across All Models)

## Overview / Main Goal
[Describe your project goal here]

## Current Status
- Phase: Bugfix — slug / URL routing
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
- Tech stack: React + React Router (Vite SPA) frontend; Cloudflare Pages Functions
  (`functions/api/**`) backend over D1 (SQLite). Auth via better-auth (`lib/auth.js`).
- Key patterns:
  - Two slug-bearing entities: `clients` (organizations) and `projects` (belong to a client).
  - `ProjectContext` exposes `current` = current PROJECT (by URL slug), and
    `currentClient` = that project's client. `:slug` is always a project slug.
  - Access control via `user_clients` join table; admins = `isAdmin` or @datadrivensr.com.
  - Slugs must be globally unique across clients AND projects (shared URL namespace),
    validated by `functions/lib/slug.js` on create and edit.
- Non-goals:
  - Multi-project-in-URL routing (see rejected decision above).

## Coding Standards
- ...

Last updated: Sat Jun  7 2026 (slug/URL routing bugfix)
