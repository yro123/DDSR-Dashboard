import { requireAdminUser } from '../../lib/authz.js'
import { today, callClaude, loadContext, buildContextBlock, writeTask, writeAssessment, CONFIDENCE_THRESHOLD } from '../../lib/analysis.js'

// POST /api/admin/analyze-snapshots
// Analyzes selected email snapshots with Claude and extracts tasks.
export async function onRequestPost({ env, request }) {
  const user = await requireAdminUser(request, env)
  if (user instanceof Response) return user

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { message_ids, project_id } = body

  if (!Array.isArray(message_ids) || message_ids.length === 0) {
    return Response.json({ error: 'message_ids must be a non-empty array' }, { status: 400 })
  }
  if (!project_id) {
    return Response.json({ error: 'project_id is required' }, { status: 400 })
  }

  const db = env.ddsr_dashboard

  try {
    // 1. Fetch snapshots for the given message_ids
    const placeholders = message_ids.map(() => '?').join(',')
    const { results: snapshots } = await db.prepare(`
      SELECT message_id, subject, from_name, from_email, received_at, body_full
      FROM email_snapshots
      WHERE message_id IN (${placeholders})
    `).bind(...message_ids).all()

    if (snapshots.length === 0) {
      return Response.json({ error: 'No snapshots found for the given message_ids' }, { status: 404 })
    }

    // 2. Load context
    const ctx = await loadContext(db)

    // 3. Build email payload
    const emailPayload = snapshots.map(e => ({
      id: e.message_id,
      subject: e.subject,
      from: `${e.from_name ?? ''} <${e.from_email}>`.trim(),
      received: e.received_at,
      body: (e.body_full ?? '').slice(0, 8000),
    }))

    // 4. Call Claude
    const todayStr = today()
    const contextBlock = buildContextBlock(ctx)

    const systemPrompt = `You are a task extraction assistant. These emails have been manually selected for task extraction — extract ALL action items regardless of whether they require an external system.

Today's date: ${todayStr}

${contextBlock}

Return JSON: { "new_tasks": [{ "title": "string", "description": "string or null", "assignee_email": "string or null", "project_id": "integer or null", "due_date": "YYYY-MM-DD or null", "priority": "high|medium|low", "source_email_id": "string", "source_excerpt": "string or null", "confidence": "0.0 to 1.0", "claude_reasoning": "string" }], "completions": [{ "task_id": "integer", "completed_by_email": "string or null", "confidence": "0.0 to 1.0", "source_email_id": "string", "notes": "string or null" }], "needs_review": [], "assessments": [{ "source_email_id": "string — one per email", "is_task": "boolean (true if it produced a new_tasks entry)", "urgency": "High|Medium|Low", "criticality": "High|Medium|Low", "resolution_bucket": "<1h|1-4h|1d|multi-day", "solution_outline": "1-2 sentence outline or null", "status": "needs_response|waiting_on_others|informational" }] }

Rules: extract every action item and follow-up. Match assignees to roster. Infer due dates from relative language. Produce exactly one assessment per email (status: needs_response = action awaited from us; waiting_on_others = blocked on someone else; informational = no action). Return empty arrays if nothing found.`

    const result = await callClaude(
      env.ANTHROPIC_API_KEY,
      systemPrompt,
      `EMAILS:\n${JSON.stringify(emailPayload, null, 2)}`,
    )

    const newTasks = Array.isArray(result.new_tasks) ? result.new_tasks : []
    const completions = Array.isArray(result.completions) ? result.completions : []
    const assessments = Array.isArray(result.assessments) ? result.assessments : []

    // 5. Write tasks
    let tasks_added = 0
    let tasks_for_review = 0

    for (const task of newTasks) {
      await writeTask(db, task, ctx.people, project_id, 'email', todayStr)
      if ((task.confidence ?? 0) >= CONFIDENCE_THRESHOLD && task.assignee_email) {
        tasks_added++
      } else {
        tasks_for_review++
      }
    }

    // 5b. Store per-email assessments (force is_task from the extracted tasks).
    const taskEmailIds = new Set(newTasks.map(t => t.source_email_id))
    for (const a of assessments) {
      await writeAssessment(db, { ...a, is_task: taskEmailIds.has(a.source_email_id) || a.is_task })
    }

    // Count completions (we log them but don't write them here — handled separately if needed)
    const completions_marked = completions.length

    return Response.json({ tasks_added, tasks_for_review, completions_marked })
  } catch (err) {
    console.error('[analyze-snapshots] Error:', err)
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
