import { requireAdminUser } from '../../../lib/authz'
import { routeParam } from '../../../lib/types'
import type { Ctx } from '../../../lib/types'
import type { FathomQueueRow } from '../../../../shared/types'

const CONFIDENCE_THRESHOLD = 0.7

interface ApproveBody {
  project_id?: number
}

// People projection used for assignee matching within a project.
interface ProjectPersonRow {
  id: number
  name: string
  email: string | null
}
// People projection used for global assignee matching.
interface GlobalPersonRow {
  id: number
  name: string
  email: string | null
  project_id: number
}

// Parsed JSON shapes stored on the queue entry (produced earlier by Claude).
interface QueueActionItem {
  text: string
  assignee_email?: string | null
}
interface QueueTopic {
  area: string
  notes?: string[]
  action_items?: QueueActionItem[]
}
interface QueueTask {
  title: string
  notes?: string | null
  assignee_email?: string | null
  project_id?: number | null
  source_email_id?: string | null
  source_excerpt?: string | null
  confidence?: number | null
  claude_reasoning?: string | null
  unmatched_assignee_name?: string | null
  unmatched_assignee_email?: string | null
  priority?: string | null
  due_date?: string | null
}
interface QueueDecision {
  decision: string
  project_id?: number | null
}

function generateSlug(title: string, date: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${base}-${date}`
}

// Claude emits lowercase priority (high|medium|low); the dashboard renders the
// capitalized form (High|Medium|Low). Normalize so pill colors and filters match.
function normalizePriority(priority: string | null | undefined): 'High' | 'Medium' | 'Low' {
  switch ((priority ?? '').toLowerCase()) {
    case 'high':   return 'High'
    case 'medium': return 'Medium'
    case 'low':    return 'Low'
    default:       return 'Medium'
  }
}

function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`
}

// PUT  /api/admin/fathom-meeting-queue/:id  { project_id }  → approve
// DELETE /api/admin/fathom-meeting-queue/:id                → reject
export async function onRequestPut({ env, params, request }: Ctx): Promise<Response> {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  const db = env.ddsr_dashboard
  const id = routeParam(params, 'id')
  const body = (await request.json()) as ApproveBody
  const { project_id } = body

  if (!project_id) return Response.json({ error: 'project_id is required' }, { status: 400 })

  // Declared outside the try so the catch block can use it for cleanup.
  let entry: FathomQueueRow | null = null

  try {
    // Load queue entry
    entry = await db.prepare(
      'SELECT * FROM fathom_meeting_queue WHERE id = ? AND status = ?'
    ).bind(id, 'pending').first<FathomQueueRow>()
    if (!entry) return Response.json({ error: 'Queue entry not found or already processed' }, { status: 404 })

    const project = await db.prepare('SELECT id FROM projects WHERE id = ? AND is_active = 1').bind(project_id).first<{ id: number }>()
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 })

    const { results: people } = await db.prepare(
      'SELECT id, name, email FROM people WHERE project_id = ? AND is_active = 1'
    ).bind(project_id).all<ProjectPersonRow>()

    // Parsed JSON columns from the queue entry — untyped at rest, cast to expected shapes.
    const attendeeEmails = JSON.parse(entry.attendee_emails || '[]') as string[]
    const topics         = JSON.parse(entry.topics_json    || '[]') as QueueTopic[]
    const tasks          = JSON.parse(entry.tasks_json     || '[]') as QueueTask[]
    const decisions      = JSON.parse(entry.decisions_json || '[]') as QueueDecision[]

    const now         = new Date().toISOString()
    const slug        = generateSlug(entry.title, entry.meeting_date)
    const displayDate = formatDisplayDate(entry.meeting_date)

    // Create meeting
    const { meta: mm } = await db.prepare(`
      INSERT INTO meetings (
        project_id, slug, title, meeting_date, display_date,
        meeting_type, duration_mins, source_type, source_email_id,
        summary, raw_notes, is_published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'Fathom Recording', ?, 'fathom', ?, ?, ?, 1, ?, ?)
    `).bind(
      project_id, slug, entry.title, entry.meeting_date, displayDate,
      entry.duration_mins ?? null, entry.source_email_id,
      entry.summary ?? null, entry.raw_notes ?? null, now, now
    ).run()

    const meetingId = mm.last_row_id

    // Attendees
    let attendeeSortOrder = 0
    for (const email of attendeeEmails) {
      const person = people.find(p => p.email?.toLowerCase() === email?.toLowerCase())
      if (person) {
        await db.prepare(`
          INSERT OR IGNORE INTO meeting_attendees (meeting_id, person_id, attendee_name, sort_order)
          VALUES (?, ?, ?, ?)
        `).bind(meetingId, person.id, person.name, attendeeSortOrder++).run()
      }
    }

    // Decisions
    for (const d of decisions) {
      await db.prepare(`
        INSERT INTO meeting_decisions (meeting_id, decision, project_id)
        VALUES (?, ?, ?)
      `).bind(meetingId, d.decision, d.project_id ?? null).run()
    }

    // Topics + notes + action items
    let topicSortOrder = 0
    for (const topic of topics) {
      const { meta: tm } = await db.prepare(`
        INSERT INTO meeting_topics (meeting_id, area, color, sort_order, created_at, updated_at)
        VALUES (?, ?, '#6366F1', ?, ?, ?)
      `).bind(meetingId, topic.area, topicSortOrder++, now, now).run()

      const topicId = tm.last_row_id

      for (let ni = 0; ni < (topic.notes || []).length; ni++) {
        await db.prepare(`
          INSERT INTO meeting_notes (topic_id, note_text, sort_order, created_at)
          VALUES (?, ?, ?, ?)
        `).bind(topicId, topic.notes![ni], ni, now).run()
      }

      for (let ai = 0; ai < (topic.action_items || []).length; ai++) {
        const item = topic.action_items![ai]
        const assignee = item.assignee_email
          ? people.find(p => p.email?.toLowerCase() === item.assignee_email?.toLowerCase())
          : null
        await db.prepare(`
          INSERT INTO meeting_action_items
            (topic_id, action_text, assignee_name, assignee_id, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(topicId, item.text, assignee?.name ?? null, assignee?.id ?? null, ai, now, now).run()
      }
    }

    // Tasks (with global people for matching)
    const { results: allPeople } = await db.prepare(
      'SELECT id, name, email, project_id FROM people WHERE is_active = 1'
    ).all<GlobalPersonRow>()

    for (const task of tasks) {
      if ((task.confidence ?? 0) < CONFIDENCE_THRESHOLD) continue

      const assignee = task.assignee_email
        ? allPeople.find(p => p.email?.toLowerCase() === task.assignee_email?.toLowerCase())
        : null

      // NOTE: tasks.assignee_name was dropped (migration 0016). The name is derived
      // at read time via COALESCE(user.name, people.name) from assignee_id.
      await db.prepare(`
        INSERT INTO tasks (
          project_id, title, notes, assignee_id,
          source_type, source_email_id, source_excerpt,
          confidence, claude_reasoning,
          unmatched_assignee_name, unmatched_assignee_email,
          priority, due_date, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'fathom', ?, ?, ?, ?, ?, ?, ?, ?, 'Not Started', ?, ?)
      `).bind(
        task.project_id ?? project_id, task.title, task.notes ?? null,
        assignee?.id ?? null,
        task.source_email_id ?? null, task.source_excerpt ?? null,
        task.confidence ?? null, task.claude_reasoning ?? null,
        task.unmatched_assignee_name ?? null, task.unmatched_assignee_email ?? null,
        normalizePriority(task.priority), task.due_date ?? null, now, now
      ).run()
    }

    // Mark queue entry as approved
    await db.prepare(`
      UPDATE fathom_meeting_queue
      SET status = 'approved', assigned_project_id = ?, reviewed_at = ?
      WHERE id = ?
    `).bind(project_id, now, id).run()

    return Response.json({ success: true, meeting_id: meetingId })

  } catch (err) {
    console.error('Fathom approve failed:', err)
    // Best-effort cleanup: delete the meeting if it was partially created
    try {
      const meeting = await db.prepare(
        'SELECT id FROM meetings WHERE source_email_id = ? AND source_type = ? ORDER BY id DESC LIMIT 1'
      ).bind(entry?.source_email_id, 'fathom').first<{ id: number }>()

      if (meeting) {
        await db.prepare('DELETE FROM meetings WHERE id = ?').bind(meeting.id).run()
      }
    } catch (cleanupErr) {
      console.error('Cleanup after Fathom approve failure failed:', cleanupErr)
    }

    return Response.json({ error: 'Failed to approve Fathom meeting' }, { status: 500 })
  }
}

export async function onRequestDelete({ env, params, request }: Ctx): Promise<Response> {
  const admin = await requireAdminUser(request, env)
  if (admin instanceof Response) return admin

  const db = env.ddsr_dashboard
  const id = routeParam(params, 'id')

  await db.prepare(`
    UPDATE fathom_meeting_queue SET status = 'dismissed', reviewed_at = ? WHERE id = ?
  `).bind(new Date().toISOString(), id).run()

  return Response.json({ success: true })
}
