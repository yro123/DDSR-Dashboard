import { requireAdminUser } from '../../lib/authz'
import { readJson, optString, optNumber, badRequestResponse } from '../../lib/validate'
import { today, callClaude, loadContext, buildContextBlock, writeTask, CONFIDENCE_THRESHOLD } from '../../lib/analysis'
import type { ExtractedTask } from '../../lib/analysis'
import type { Ctx } from '../../lib/types'

// Shape of an action item inside a meeting topic as returned by Claude.
interface ClaudeActionItem {
  text?: string
  assignee_email?: string | null
}
interface ClaudeTopic {
  area?: string
  notes?: unknown
  action_items?: unknown
}
interface ClaudeMeetingInfo {
  title?: string
  meeting_date?: string
  duration_mins?: number | null
  attendee_emails?: string[]
  summary?: string | null
  raw_notes?: string | null
  topics?: unknown
}
interface ClaudeDecision {
  decision: string
  project_id?: number | null
}
// Claude's parsed JSON response shape for both the tasks and meeting flows.
interface ClaudeResult {
  new_tasks?: unknown
  completions?: unknown
  needs_review?: unknown
  meeting?: ClaudeMeetingInfo
  decisions?: unknown
}

// POST /api/admin/analyze-text
// Analyzes pasted text with Claude to extract tasks or a full meeting.
export async function onRequestPost({ env, request }: Ctx): Promise<Response> {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  let text: string | null
  let project_id: number | null
  let type: string | null
  try {
    const body = await readJson(request)
    text = optString(body, 'text')
    project_id = optNumber(body, 'project_id')
    type = optString(body, 'type')
  } catch (err) {
    return badRequestResponse(err)
  }

  if (!text?.trim()) {
    return Response.json({ error: 'text is required' }, { status: 400 })
  }
  if (!project_id) {
    return Response.json({ error: 'project_id is required' }, { status: 400 })
  }
  if (type !== 'tasks' && type !== 'meeting') {
    return Response.json({ error: 'type must be "tasks" or "meeting"' }, { status: 400 })
  }

  const db = env.ddsr_dashboard
  const todayStr = today()

  try {
    const ctx = await loadContext(db)
    const contextBlock = buildContextBlock(ctx)

    // ── Tasks extraction ──────────────────────────────────────────────────────
    if (type === 'tasks') {
      const systemPrompt = `You are a task extraction assistant. The following text has been manually submitted for task extraction — extract ALL action items and follow-ups regardless of how they would be handled.

Today's date: ${todayStr}

${contextBlock}

Return JSON: { "new_tasks": [{ "title": "string", "description": "string or null", "assignee_email": "string or null", "project_id": "integer or null", "due_date": "YYYY-MM-DD or null", "priority": "high|medium|low", "source_email_id": null, "source_excerpt": "string or null", "confidence": "0.0 to 1.0", "claude_reasoning": "string" }], "completions": [], "needs_review": [] }

Rules: extract every explicit action item, request, and follow-up. Match assignees to the team roster when possible; leave assignee_email null if unclear. Infer due dates from relative language using today's date. Return empty arrays if nothing found.`

      // Claude returns untyped JSON — cast to the expected response shape.
      const result = (await callClaude(
        env.ANTHROPIC_API_KEY as string,
        systemPrompt,
        `TEXT:\n${text}`,
      )) as ClaudeResult

      const newTasks = (Array.isArray(result.new_tasks) ? result.new_tasks : []) as ExtractedTask[]

      let tasks_added = 0
      let tasks_for_review = 0

      for (const task of newTasks) {
        await writeTask(db, task, ctx.people, project_id, 'manual', todayStr)
        if ((task.confidence ?? 0) >= CONFIDENCE_THRESHOLD && task.assignee_email) {
          tasks_added++
        } else {
          tasks_for_review++
        }
      }

      return Response.json({ tasks_added, tasks_for_review })
    }

    // ── Meeting extraction ────────────────────────────────────────────────────
    if (type === 'meeting') {
      const systemPrompt = `You are parsing meeting notes or a meeting summary email. Extract ALL information as a single JSON object.

Today's date: ${todayStr}

${contextBlock}

Return JSON:
{
  "meeting": {
    "title": "string",
    "meeting_date": "YYYY-MM-DD",
    "duration_mins": "integer or null",
    "attendee_emails": ["email addresses of attendees if mentioned"],
    "summary": "2-3 sentence summary",
    "raw_notes": "full notes text",
    "topics": [{ "area": "string", "notes": ["string"], "action_items": [{ "text": "string", "assignee_email": "string or null" }] }]
  },
  "decisions": [{ "decision": "string", "project_id": "integer or null" }],
  "new_tasks": [{ "title": "string", "description": "string or null", "assignee_email": "string or null", "project_id": "integer or null", "due_date": "YYYY-MM-DD or null", "priority": "high|medium|low", "source_email_id": null, "source_excerpt": "string or null", "confidence": "0.0 to 1.0", "claude_reasoning": "string" }],
  "completions": []
}

Use today's date if meeting date is unclear. Match assignees and projects from context.`

      // Claude returns untyped JSON — cast to the expected response shape.
      const result = (await callClaude(
        env.ANTHROPIC_API_KEY as string,
        systemPrompt,
        `TEXT:\n${text}`,
      )) as ClaudeResult

      const meetingInfo: ClaudeMeetingInfo = result.meeting ?? {}
      const decisions = (Array.isArray(result.decisions) ? result.decisions : []) as ClaudeDecision[]
      const newTasks = (Array.isArray(result.new_tasks) ? result.new_tasks : []) as ExtractedTask[]

      const now = new Date().toISOString()

      // Generate a slug from title + date
      const meetingDate = meetingInfo.meeting_date ?? todayStr
      const slugBase = (meetingInfo.title ?? 'meeting')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const slug = `${slugBase}-${meetingDate.replace(/-/g, '')}`

      // Format display date e.g. "June 3, 2026"
      const [yr, mo, dy] = meetingDate.split('-')
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ]
      const displayDate = `${months[parseInt(mo, 10) - 1]} ${parseInt(dy, 10)}, ${yr}`

      // INSERT meeting
      const { meta: meetingMeta } = await db.prepare(`
        INSERT INTO meetings (
          project_id, slug, title, meeting_date, display_date,
          duration_mins, source_type, summary, raw_notes,
          is_published, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'manual', ?, ?, 1, ?, ?)
      `).bind(
        project_id,
        slug,
        meetingInfo.title ?? 'Untitled Meeting',
        meetingDate,
        displayDate,
        meetingInfo.duration_mins ?? null,
        meetingInfo.summary ?? null,
        meetingInfo.raw_notes ?? null,
        now, now,
      ).run()

      const meetingId = meetingMeta.last_row_id

      // INSERT topics → notes → action items
      const topics = (Array.isArray(meetingInfo.topics) ? meetingInfo.topics : []) as ClaudeTopic[]
      let topicSortOrder = 0

      for (const topic of topics) {
        const { meta: topicMeta } = await db.prepare(`
          INSERT INTO meeting_topics (meeting_id, area, color, sort_order, created_at, updated_at)
          VALUES (?, ?, '#6366F1', ?, ?, ?)
        `).bind(meetingId, topic.area ?? '', topicSortOrder++, now, now).run()

        const topicId = topicMeta.last_row_id

        const notes = (Array.isArray(topic.notes) ? topic.notes : []) as string[]
        for (let ni = 0; ni < notes.length; ni++) {
          await db.prepare(`
            INSERT INTO meeting_notes (topic_id, note_text, sort_order, created_at)
            VALUES (?, ?, ?, ?)
          `).bind(topicId, notes[ni], ni, now).run()
        }

        const actionItems = (Array.isArray(topic.action_items) ? topic.action_items : []) as ClaudeActionItem[]
        for (let ai = 0; ai < actionItems.length; ai++) {
          const item = actionItems[ai]
          const assignee = item.assignee_email
            ? ctx.people.find(p => p.email?.toLowerCase() === item.assignee_email!.toLowerCase())
            : null
          await db.prepare(`
            INSERT INTO meeting_action_items
              (topic_id, action_text, assignee_name, assignee_id, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            topicId,
            item.text ?? '',
            assignee?.name ?? null,
            assignee?.id ?? null,
            ai,
            now, now,
          ).run()
        }
      }

      // INSERT decisions
      for (const d of decisions) {
        await db.prepare(`
          INSERT INTO meeting_decisions (meeting_id, decision, project_id)
          VALUES (?, ?, ?)
        `).bind(meetingId, d.decision, d.project_id ?? null).run()
      }

      // Write tasks
      let tasks_added = 0
      let tasks_for_review = 0

      for (const task of newTasks) {
        await writeTask(db, task, ctx.people, project_id, 'manual', todayStr)
        if ((task.confidence ?? 0) >= CONFIDENCE_THRESHOLD && task.assignee_email) {
          tasks_added++
        } else {
          tasks_for_review++
        }
      }

      return Response.json({
        meeting_id: meetingId,
        meeting_title: meetingInfo.title ?? 'Untitled Meeting',
        tasks_added,
        tasks_for_review,
      })
    }

    // Unreachable: type is validated to be 'tasks' or 'meeting' above.
    return Response.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('[analyze-text] Error:', err)
    return Response.json({ error: (err as Error).message ?? 'Internal server error' }, { status: 500 })
  }
}
