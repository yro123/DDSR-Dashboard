/**
 * Shared, runtime-neutral types used by BOTH the frontend (DOM) and the
 * Cloudflare Pages Functions backend (Workers runtime).
 *
 * RULES for this file:
 * - No DOM globals, no Workers globals (no `D1Database`, no `Response`, no React).
 * - Types only; `import type` if you ever import. Anything that needs a runtime
 *   value (e.g. brand constructors below) must be plain JS with no platform deps.
 *
 * Backend-only types (Env, request context, D1 bindings) live in
 * `functions/lib/types.ts`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Branded identifiers
//
// The app routes are all `/:slug/...` and there are TWO slug-bearing entities —
// clients and projects — that share that single URL namespace. Branding the two
// slug types makes it a COMPILE ERROR to pass a client slug where a project slug
// is expected (the exact bug class that shipped before the TS migration).
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectSlug = string & { readonly __brand: 'ProjectSlug' }
export type ClientSlug = string & { readonly __brand: 'ClientSlug' }

/** Assert/brand a raw string as a project slug (callers own the invariant). */
export function asProjectSlug(s: string): ProjectSlug {
  return s as ProjectSlug
}
/** Assert/brand a raw string as a client slug. */
export function asClientSlug(s: string): ClientSlug {
  return s as ClientSlug
}

// ─────────────────────────────────────────────────────────────────────────────
// Database row types — mirror the D1 schema (see migrations/*.sql).
// Convention: INTEGER -> number, TEXT -> string, nullable column -> `| null`.
// Integer boolean columns (is_active, is_archived, ...) are stored as 0/1 number.
// ─────────────────────────────────────────────────────────────────────────────

export interface ClientRow {
  id: number
  name: string
  display_name: string
  slug: ClientSlug
  /** Added in migration 0019xx — lowercase email domain used for auto-mapping. */
  email_domain: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface ProjectRow {
  id: number
  name: string
  client_display_name: string
  subtitle: string | null
  slug: ProjectSlug
  go_live_date: string | null
  project_start_date: string | null
  project_end_date: string | null
  is_active: number
  /** Added in migration 0004 (ALTER TABLE projects ADD COLUMN client_id). */
  client_id: number | null
  created_at: string
  updated_at: string
}

export interface PersonRow {
  id: number
  project_id: number
  name: string
  email: string | null
  role: string | null
  org_type: string | null
  avatar_bg: string | null
  avatar_fg: string | null
  is_active: number
  /** Added in better-auth migration — links a person to an authenticated user. */
  user_id: string | null
  invited_at: string | null
  invited_by: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowRow {
  id: number
  project_id: number
  slug: string
  name: string
  short_name: string
  description: string | null
  color: string | null
  bg_color: string | null
  phase: string | null
  icon: string | null
  sort_order: number
  is_active: number
  created_at: string
  updated_at: string
}

export interface WorkflowStepRow {
  id: number
  workflow_id: number
  label: string
  status: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DocumentRow {
  id: number
  project_id: number
  workflow_id: number | null
  name: string
  url: string | null
  doc_type: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface TaskRow {
  id: number
  project_id: number
  workflow_id: number | null
  assignee_id: number | null
  assignee_name: string | null
  title: string
  notes: string | null
  status: string
  priority: string | null
  due_date: string | null
  is_archived: number
  archived_at: string | null
  source_meeting_id: number | null
  source_action_item_id: number | null
  sort_order: number
  // Email-automation columns (migration 0006).
  source_type: string | null
  source_email_id: string | null
  source_excerpt: string | null
  source_highlight_start: number | null
  source_highlight_end: number | null
  confidence: number | null
  claude_reasoning: string | null
  user_feedback: string | null
  completed_by_id: number | null
  completion_source_email: string | null
  unmatched_assignee_name: string | null
  unmatched_assignee_email: string | null
  created_at: string
  updated_at: string
}

export interface MeetingRow {
  id: number
  project_id: number
  slug: string
  meeting_date: string
  display_date: string | null
  title: string
  meeting_type: string | null
  location: string | null
  next_meeting: string | null
  is_published: number
  // Email-automation columns.
  source_type: string | null
  source_email_id: string | null
  duration_mins: number | null
  summary: string | null
  raw_notes: string | null
  created_at: string
  updated_at: string
}

export interface MeetingTopicRow {
  id: number
  meeting_id: number
  workflow_id: number | null
  area: string
  color: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface MeetingNoteRow {
  id: number
  topic_id: number
  note_text: string
  sort_order: number
  created_at: string
}

export interface MeetingActionItemRow {
  id: number
  topic_id: number
  action_text: string
  assignee_name: string | null
  assignee_id: number | null
  status: string
  task_id: number | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface AppConfigRow {
  id: number
  project_id: number | null
  category: string
  value: string
  label: string | null
  color: string | null
  sort_order: number
  is_active: number
  is_system: number
  created_at: string
  updated_at: string
}

export interface UserClientRow {
  user_id: string
  client_id: number
  role: string
  created_at: string
  updated_at: string
}

export interface InvitationRow {
  id: string
  token: string
  clientSlug: string
  createdBy: string
  email: string | null
  expiresAt: number
  usedAt: number | null
  usedBy: string | null
  /** Added in migration 0019 (ALTER TABLE invitations ADD COLUMN client_id). */
  client_id: number | null
}

export interface FathomQueueRow {
  id: number
  source_email_id: string
  title: string
  meeting_date: string
  duration_mins: number | null
  summary: string | null
  raw_notes: string | null
  attendee_emails: string | null
  topics_json: string | null
  tasks_json: string | null
  decisions_json: string | null
  status: string
  assigned_project_id: number | null
  reviewed_at: string | null
  created_at: string
}

export interface TicketRequestRow {
  id: string
  project_id: number
  submitted_by_id: string | null
  submitted_by_name: string | null
  title: string
  description: string
  category: string
  priority: string
  workflow_id: number | null
  requested_due_date: string | null
  status: string
  reviewer_notes: string | null
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: number | null
  task_id: number | null
  created_at: number
  updated_at: number
}

/** better-auth managed `user` table. */
export interface UserRow {
  id: string
  name: string
  email: string
  emailVerified: number
  image: string | null
  createdAt: number
  updatedAt: number
  /** Legacy column, ignored by the access model. */
  clientSlug: string | null
  isAdmin: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth / session
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of the authenticated user as surfaced by better-auth on the session. */
export interface SessionUser {
  id: string
  email: string
  name?: string | null
  /** better-auth additionalField — exposed as a real boolean on the session. */
  isAdmin?: boolean
  emailVerified?: boolean
  image?: string | null
}

export interface AuthSession {
  user: SessionUser
  session?: { id: string; userId: string; expiresAt?: string | number; [k: string]: unknown }
}

// ─────────────────────────────────────────────────────────────────────────────
// API DTOs — shapes that actually cross the wire (not raw table rows).
// ─────────────────────────────────────────────────────────────────────────────

/** Project as embedded in the GET /api/clients response. */
export interface ProjectSummary {
  id: number
  slug: ProjectSlug
  name: string
  subtitle: string | null
  client_id: number | null
}

/** GET /api/clients item: a client plus its active projects. */
export interface ClientWithProjects {
  id: number
  slug: ClientSlug
  display_name: string
  name: string
  email_domain: string | null
  is_active: number
  projects: ProjectSummary[]
}

/** Task projection returned by task list/detail endpoints (joins assignee + workflow). */
export interface TaskWithMeta extends TaskRow {
  assignee_name: string | null
  workflow_name?: string | null
  workflow_color?: string | null
  project_name?: string | null
  project_slug?: ProjectSlug | null
}

// ── Mutation request bodies (validated at runtime in handlers; see lib/validate) ──

export interface CreateClientBody {
  name: string
  display_name: string
  slug: string
  email_domain?: string | null
}

export interface UpdateClientBody {
  name?: string
  display_name?: string
  slug?: string
  is_active?: number | boolean
  email_domain?: string | null
}

export interface CreateProjectBody {
  client_id: number
  name: string
  slug: string
  subtitle?: string | null
  go_live_date?: string | null
  project_start_date?: string | null
}
