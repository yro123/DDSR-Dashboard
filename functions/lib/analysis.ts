/**
 * Shared analysis helpers for admin Claude-powered endpoints.
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

export const CONFIDENCE_THRESHOLD = 0.7

// ── Date helper ──────────────────────────────────────────────────────────────

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

// ── Claude API ───────────────────────────────────────────────────────────────

interface ClaudeContentBlock {
  type: string
  text?: string
}
interface ClaudeResponse {
  content?: ClaudeContentBlock[]
}

/**
 * Calls the Anthropic API and returns parsed JSON.
 * Strips markdown code fences from the response. Throws on network or API error.
 */
export async function callClaude(apiKey: string, systemPrompt: string, userContent: string): Promise<unknown> {
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Claude API error: ${res.status} ${text}`)
  }

  const data = (await res.json()) as ClaudeResponse
  const text = data.content?.find((c) => c.type === 'text')?.text ?? ''

  // Strip markdown code fences if Claude wraps the JSON
  const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  return JSON.parse(clean)
}

// ── Context loader ───────────────────────────────────────────────────────────

export interface AnalysisPerson {
  id: number
  name: string
  email: string | null
  role: string | null
  project_id: number
}
export interface AnalysisProject {
  id: number
  name: string
}
export interface AnalysisTask {
  id: number
  title: string
  assignee_id: number | null
  project_id: number
}
export interface DomainInfo {
  project_id: number
  project_name: string
}
export interface AnalysisContext {
  people: AnalysisPerson[]
  projects: AnalysisProject[]
  openTasks: AnalysisTask[]
  domainMap: Record<string, DomainInfo>
}

/** Loads people, projects, openTasks, and domainMap from the D1 database. */
export async function loadContext(db: D1Database): Promise<AnalysisContext> {
  const [peopleRes, projectsRes, tasksRes, domainRes] = await Promise.all([
    db.prepare('SELECT id, name, email, role, project_id FROM people WHERE is_active = 1').all<AnalysisPerson>(),
    db.prepare('SELECT id, name FROM projects WHERE is_active = 1').all<AnalysisProject>(),
    db.prepare("SELECT id, title, assignee_id, project_id FROM tasks WHERE status != 'Done' AND is_archived = 0").all<AnalysisTask>(),
    db.prepare(`
      SELECT c.email_domain, p.id AS project_id, p.name AS project_name
      FROM clients c
      JOIN projects p ON p.client_id = c.id
      WHERE c.email_domain IS NOT NULL AND c.email_domain != '' AND c.is_active = 1 AND p.is_active = 1
    `).all<{ email_domain: string; project_id: number; project_name: string }>(),
  ])

  const domainMap: Record<string, DomainInfo> = {}
  for (const row of domainRes.results) {
    domainMap[row.email_domain.toLowerCase()] = {
      project_id: row.project_id,
      project_name: row.project_name,
    }
  }

  return {
    people: peopleRes.results,
    projects: projectsRes.results,
    openTasks: tasksRes.results,
    domainMap,
  }
}

// ── Context block formatter ────────────────────────────────────────────────────

/** Formats context as a multi-section string for Claude prompts. */
export function buildContextBlock(ctx: AnalysisContext): string {
  const domainEntries = Object.entries(ctx.domainMap).map(([domain, info]) => ({
    domain,
    project_id: info.project_id,
    project_name: info.project_name,
  }))

  return [
    `TEAM ROSTER:\n${JSON.stringify(ctx.people.map((p) => ({ id: p.id, name: p.name, email: p.email, role: p.role })), null, 2)}`,
    `PROJECTS:\n${JSON.stringify(ctx.projects.map((p) => ({ id: p.id, name: p.name })), null, 2)}`,
    `CLIENT EMAIL DOMAINS (use domain to assign project_id):\n${JSON.stringify(domainEntries, null, 2)}`,
    `OPEN TASKS (for completion matching):\n${JSON.stringify(ctx.openTasks.map((t) => ({ id: t.id, title: t.title, assignee_id: t.assignee_id })), null, 2)}`,
  ].join('\n\n')
}

// ── Priority normalizer ─────────────────────────────────────────────────────────

function normalizePriority(priority: string | null | undefined): 'High' | 'Medium' | 'Low' {
  switch ((priority ?? '').toLowerCase()) {
    case 'high': return 'High'
    case 'medium': return 'Medium'
    case 'low': return 'Low'
    default: return 'Medium'
  }
}

// ── Task writer ─────────────────────────────────────────────────────────────────

export interface ExtractedTask {
  title: string
  description?: string | null
  assignee_email?: string | null
  project_id?: number | null
  source_email_id?: string | null
  source_excerpt?: string | null
  confidence?: number | null
  claude_reasoning?: string | null
  priority?: string | null
  due_date?: string | null
}

/** Inserts a task and a task_event into the database. Returns the new task id. */
export async function writeTask(
  db: D1Database,
  task: ExtractedTask,
  people: AnalysisPerson[],
  defaultProjectId: number,
  sourceType: string,
  _todayStr?: string,
  assigneeIdOverride?: number | null,
): Promise<number | undefined> {
  // An explicit override (e.g. picked in the Manual tab) wins over Claude's
  // email-based match. Falls back to matching the assignee_email to the roster.
  const matched = task.assignee_email
    ? people.find((p) => p.email?.toLowerCase() === task.assignee_email!.toLowerCase())
    : null
  const assigneeId = assigneeIdOverride ?? matched?.id ?? null
  const hasAssignee = assigneeId != null

  const projectId = task.project_id ?? defaultProjectId
  const now = new Date().toISOString()

  const { meta } = await db.prepare(`
    INSERT INTO tasks (
      project_id, title, notes, assignee_id,
      source_type, source_email_id, source_excerpt,
      confidence, claude_reasoning,
      unmatched_assignee_name, unmatched_assignee_email,
      priority, due_date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Not Started', ?, ?)
  `).bind(
    projectId,
    task.title,
    task.description ?? null,
    assigneeId,
    sourceType,
    task.source_email_id ?? null,
    task.source_excerpt ?? null,
    task.confidence ?? null,
    task.claude_reasoning ?? null,
    hasAssignee ? null : (task.assignee_email ? task.assignee_email.split('@')[0] : null),
    hasAssignee ? null : (task.assignee_email ?? null),
    normalizePriority(task.priority),
    task.due_date ?? null,
    now, now,
  ).run()

  const taskId = meta.last_row_id

  await db.prepare(`
    INSERT INTO task_events (task_id, event_type, source_email, notes, created_at)
    VALUES (?, 'created', ?, 'Manually analyzed via Review page', ?)
  `).bind(taskId, task.source_email_id ?? null, now).run()

  return taskId as number | undefined
}

// ── Assessment writer ───────────────────────────────────────────────────────────

export interface EmailAssessment {
  source_email_id: string
  is_task?: boolean
  urgency?: string | null
  criticality?: string | null
  resolution_bucket?: string | null
  solution_outline?: string | null
  status?: string | null
  suggest_block?: boolean
  block_reason?: string | null
}

/** Store Claude's per-email rating onto the existing snapshot row. Best-effort. */
export async function writeAssessment(db: D1Database, a: EmailAssessment | null | undefined): Promise<void> {
  if (!a || !a.source_email_id) return
  try {
    await db.prepare(`
      UPDATE email_snapshots SET
        is_task = ?, urgency = ?, criticality = ?, resolution_bucket = ?,
        solution_outline = ?, assessment_status = ?, suggest_block = ?, block_reason = ?, assessed_at = ?
      WHERE message_id = ?
    `).bind(
      a.is_task ? 1 : 0,
      a.urgency ?? null,
      a.criticality ?? null,
      a.resolution_bucket ?? null,
      a.solution_outline ?? null,
      a.status ?? null,
      a.suggest_block ? 1 : 0,
      a.block_reason ?? null,
      new Date().toISOString(),
      a.source_email_id,
    ).run()
  } catch (err) {
    console.warn('[analysis] writeAssessment skipped:', (err as Error).message)
  }
}
