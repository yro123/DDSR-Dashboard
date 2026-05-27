// PUT  /api/fathom-meeting-queue/:id  { project_id }  → approve: creates meeting + tasks
// DELETE /api/fathom-meeting-queue/:id                → reject: marks dismissed

const CONFIDENCE_THRESHOLD = 0.7

function generateSlug(title, date) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${base}-${date}`
}

function formatDisplayDate(isoDate) {
  const [year, month, day] = isoDate.split('-')
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`
}

// ── Approve: create meeting record from queue entry ─────────────────────────
export async function onRequestPut({ env, params, request }) {
  const db = env.ddsr_dashboard
  const { id } = params
  const body = await request.json()
  const { project_id } = body

  if (!project_id) return Response.json({ error: 'project_id is required' }, { status: 400 })

  // Load queue entry
  const entry = await db.prepare(
    'SELECT * FROM fathom_meeting_queue WHERE id = ? AND status = ?'
  ).bind(id, 'pending').first()
  if (!entry) return Response.json({ error: 'Queue entry not found or already processed' }, { status: 404 })

  // Verify project exists
  const project = await db.prepare('SELECT id FROM projects WHERE id = ? AND is_active = 1').bind(project_id).first()
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 })

  // Load people for this project (for attendee + assignee matching)
  const { results: people } = await db.prepare(
    'SELECT id, name, email FROM people WHERE project_id = ? AND is_active = 1'
  ).bind(project_id).all()

  // Parse stored JSON blobs
  const attendeeEmails = JSON.parse(entry.attendee_emails || '[]')
  const topics         = JSON.parse(entry.topics_json    || '[]')
  const tasks          = JSON.parse(entry.tasks_json     || '[]')
  const decisions      = JSON.parse(entry.decisions_json || '[]')

  const now         = new Date().toISOString()
  const slug        = generateSlug(entry.title, entry.meeting_date)
  const displayDate = formatDisplayDate(entry.meeting_date)

  // ── Create meeting ──────────────────────────────────────────────────────
  const { meta: mm } = await db.prepare(`
    INSERT INTO meetings (
      project_id, slug, title, meeting_date, display_date,
      meeting_type, duration_mins, source_type, source_email_id,
      summary, raw_notes, is_published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'Fathom Recording', ?, 'fathom', ?, ?, ?, 1, ?, ?)
  `).bind(
    project_id,
    slug,
    entry.title,
    entry.meeting_date,
    displayDate,
    entry.duration_mins ?? null,
    entry.source_email_id,
    entry.summary ?? null,
    entry.raw_notes ?? null,
    now, now,
  ).run()

  const meetingId = mm.last_row_id

  // ── Attendees ────────────────────────────────────────────────────────────
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

  // ── Decisions ────────────────────────────────────────────────────────────
  for (const d of decisions) {
    await db.prepare(`
      INSERT INTO meeting_decisions (meeting_id, decision, project_id)
      VALUES (?, ?, ?)
    `).bind(meetingId, d.decision, d.project_id ?? null).run()
  }

  // ── Topics → notes → action items ────────────────────────────────────────
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
      `).bind(topicId, topic.notes[ni], ni, now).run()
    }

    for (let ai = 0; ai < (topic.action_items || []).length; ai++) {
      const item    = topic.action_items[ai]
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

  // ── Tasks ─────────────────────────────────────────────────────────────────
  // Also load people globally so we can match assignees across all projects
  const { results: allPeople } = await db.prepare(
    'SELECT id, name, email, project_id FROM people WHERE is_active = 1'
  ).all()

  let tasksCreated = 0
  for (const task of tasks) {
    if ((task.confidence ?? 0) < CONFIDENCE_THRESHOLD) continue

    const assignee = task.assignee_email
      ? allPeople.find(p => p.email?.toLowerCase() === task.assignee_email?.toLowerCase())
      : null

    const { meta: taskMeta } = await db.prepare(`
      INSERT INTO tasks (
        project_id, title, notes, assignee_id, assignee_name,
        source_type, source_email_id, source_excerpt,
        confidence, claude_reasoning,
        unmatched_assignee_name, unmatched_assignee_email,
        priority, due_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'fathom', ?, ?, ?, ?, ?, ?, ?, ?, 'Not Started', ?, ?)
    `).bind(
      task.project_id ?? project_id,
      task.title,
      task.description ?? null,
      assignee?.id ?? null,
      assignee?.name ?? null,
      entry.source_email_id,
      task.source_excerpt ?? null,
      task.confidence,
      task.claude_reasoning ?? null,
      assignee ? null : (task.assignee_email ? task.assignee_email.split('@')[0] : null),
      assignee ? null : (task.assignee_email ?? null),
      task.priority ?? 'medium',
      task.due_date ?? null,
      now, now,
    ).run()

    await db.prepare(`
      INSERT INTO task_events (task_id, event_type, source_email, notes, created_at)
      VALUES (?, 'created', ?, 'Auto-extracted by Claude (approved from Fathom queue)', ?)
    `).bind(taskMeta.last_row_id, entry.source_email_id, now).run()

    tasksCreated++
  }

  // ── Mark queue entry approved ─────────────────────────────────────────────
  await db.prepare(`
    UPDATE fathom_meeting_queue
    SET status = 'approved', assigned_project_id = ?, reviewed_at = ?
    WHERE id = ?
  `).bind(project_id, now, id).run()

  return Response.json({ ok: true, meeting_id: meetingId, tasks_created: tasksCreated })
}

// ── Reject: dismiss without creating meeting ────────────────────────────────
export async function onRequestDelete({ env, params }) {
  const db = env.ddsr_dashboard
  const now = new Date().toISOString()

  const { meta } = await db.prepare(`
    UPDATE fathom_meeting_queue
    SET status = 'rejected', reviewed_at = ?
    WHERE id = ? AND status = 'pending'
  `).bind(now, params.id).run()

  if (meta.changes === 0) {
    return Response.json({ error: 'Queue entry not found or already processed' }, { status: 404 })
  }

  return Response.json({ ok: true })
}
