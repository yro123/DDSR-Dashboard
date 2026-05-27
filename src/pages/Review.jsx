import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useProject } from '../context/ProjectContext'
import Avatar from '../components/Avatar'
import { PriorityPill } from '../components/Pill'

function fmtDate(d) {
  if (!d) return ''
  try {
    const [, m, dy] = d.split('-')
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1] + ' ' + parseInt(dy)
  } catch { return '' }
}

function ConfidenceBadge({ confidence }) {
  if (confidence == null) return <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>no score</span>
  const pct = Math.round(confidence * 100)
  const color = confidence >= 0.85 ? '#16a34a' : confidence >= 0.6 ? '#d97706' : '#dc2626'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', borderRadius: 4, padding: '2px 6px' }}>
      {pct}% confidence
    </span>
  )
}

// ── Pending Fathom Meeting Card ───────────────────────────────────────────────

function PendingMeetingCard({ entry, projects, onApprove, onReject }) {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const attendeeEmails = (() => { try { return JSON.parse(entry.attendee_emails || '[]') } catch { return [] } })()
  const topics         = (() => { try { return JSON.parse(entry.topics_json     || '[]') } catch { return [] } })()

  const handleApprove = async () => {
    if (!selectedProjectId) return
    setSubmitting(true)
    await onApprove(entry, parseInt(selectedProjectId, 10))
    setSubmitting(false)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid #6366f130',
      borderLeft: '4px solid #6366f1',
      borderRadius: 10,
      padding: '16px 18px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🎙️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3, lineHeight: 1.3 }}>
            {entry.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{fmtDate(entry.meeting_date)}</span>
            {entry.duration_mins && (
              <span style={{ fontSize: 11, color: '#6366f1', background: '#6366f115', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
                {entry.duration_mins} min
              </span>
            )}
            <span style={{ fontSize: 11, color: '#d97706', background: '#fef3c7', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
              ⚠️ No client match
            </span>
          </div>
        </div>
      </div>

      {entry.summary && (
        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, marginBottom: 10 }}>{entry.summary}</div>
      )}

      {attendeeEmails.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>Attendees ({attendeeEmails.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {attendeeEmails.map((email, i) => (
              <span key={i} style={{ fontSize: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '2px 8px', color: 'var(--text-muted)' }}>
                {email}
              </span>
            ))}
          </div>
        </div>
      )}

      {topics.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setExpanded(v => !v)} style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: expanded ? 8 : 0 }}>
            {expanded ? '▾' : '▸'} {topics.length} topic{topics.length !== 1 ? 's' : ''} extracted
          </button>
          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topics.map((topic, ti) => (
                <div key={ti} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: '3px solid #6366f1', borderRadius: '0 6px 6px 0', padding: '8px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{topic.area}</div>
                  {(topic.notes || []).map((note, ni) => (
                    <div key={ni} style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 2 }}>• {note}</div>
                  ))}
                  {(topic.action_items || []).length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      {topic.action_items.map((item, ai) => (
                        <div key={ai} style={{ fontSize: 11, color: '#d97706', background: '#fef3c720', borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginRight: 4, marginTop: 2 }}>
                          ↗ {item.text}{item.assignee_email && <span style={{ opacity: 0.7 }}> · {item.assignee_email}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 200px', minWidth: 160 }}>
          <option value="">— assign to project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.client_name ? `${p.client_name} · ` : ''}{p.name}</option>)}
        </select>
        <button onClick={handleApprove} disabled={!selectedProjectId || submitting}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: 'none', background: selectedProjectId ? '#6366f1' : '#e5e7eb', color: selectedProjectId ? '#fff' : '#9ca3af', cursor: selectedProjectId ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
          {submitting ? 'Creating…' : '✓ Create Meeting'}
        </button>
        <button onClick={() => onReject(entry)}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}>
          ✕ Dismiss
        </button>
        {entry.source_email_id && (
          <a href={`https://outlook.office.com/mail/deeplink?ItemID=${encodeURIComponent(entry.source_email_id)}`}
            target="_blank" rel="noreferrer"
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            📧 Open in Outlook
          </a>
        )}
      </div>
    </div>
  )
}

// ── Task Review Card ──────────────────────────────────────────────────────────

function ReviewCard({ task, people, onConfirm, onDismiss, onReassign }) {
  const [reassigning, setReassigning] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState('')
  const sourceIcon = task.source_type === 'fathom' ? '🎙️' : '📧'
  const personAv = name => {
    const p = people.find(p => p.name === name)
    return { bg: p?.avatar_bg || '#F3F4F6', fg: p?.avatar_fg || '#374151' }
  }

  const handleReassign = () => {
    if (!selectedPerson) return
    const person = people.find(p => p.name === selectedPerson)
    onReassign(task, person)
    setReassigning(false)
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{sourceIcon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3, lineHeight: 1.3 }}>{task.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ConfidenceBadge confidence={task.confidence} />
            {task.due_date && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Due {fmtDate(task.due_date)}</span>}
            <PriorityPill priority={task.priority} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        {task.assignee_id ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Avatar name={task.assignee_name} {...personAv(task.assignee_name)} size={20} />
            <span style={{ fontSize: 12, color: 'var(--text)' }}>{task.assignee_name}</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, padding: '4px 8px', background: '#fef3c7', borderRadius: 6, display: 'inline-block' }}>
            ⚠️ Unmatched assignee
            {task.unmatched_assignee_name && <span style={{ color: '#92400e', fontWeight: 600 }}> — {task.unmatched_assignee_name}</span>}
            {task.unmatched_assignee_email && <span style={{ color: '#92400e' }}> ({task.unmatched_assignee_email})</span>}
            <span style={{ color: '#78350f', marginLeft: 4 }}>· Person needs to be created in Admin → People</span>
          </div>
        )}
      </div>

      {task.email_from_name && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
          From <strong style={{ color: 'var(--text-muted)' }}>{task.email_from_name}</strong>
          {task.email_subject && <> · <em>{task.email_subject}</em></>}
          {task.email_received_at && <> · {new Date(task.email_received_at).toLocaleDateString()}</>}
        </div>
      )}

      {task.source_excerpt && (
        <div style={{ fontSize: 12, color: 'var(--text)', background: 'var(--surface-2)', borderLeft: '3px solid var(--accent)', padding: '8px 10px', borderRadius: '0 6px 6px 0', marginBottom: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
          "{task.source_excerpt}"
        </div>
      )}

      {task.claude_reasoning && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600 }}>Claude: </span>{task.claude_reasoning}
        </div>
      )}

      {reassigning ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select autoFocus value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: 1 }}>
            <option value="">— select assignee —</option>
            {people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <button onClick={handleReassign} disabled={!selectedPerson}
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>Assign</button>
          <button onClick={() => setReassigning(false)}
            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => onConfirm(task)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>✓ Confirm task</button>
          <button onClick={() => setReassigning(true)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer' }}>↩ Reassign</button>
          <button onClick={() => onDismiss(task)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}>✕ Dismiss</button>
          {task.source_email_id && (
            <a href={`https://outlook.office.com/mail/deeplink?ItemID=${encodeURIComponent(task.source_email_id)}`}
              target="_blank" rel="noreferrer"
              style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              📧 Open in Outlook
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Project Section ───────────────────────────────────────────────────────────

function ProjectSection({ name, tasks, people, onConfirm, onDismiss, onReassign }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '12px 16px', background: 'var(--surface-2)',
          border: 'none', borderBottom: collapsed ? 'none' : '1px solid var(--border)',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{name}</span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
          background: '#fef3c7', color: '#d97706',
        }}>{tasks.length} item{tasks.length !== 1 ? 's' : ''}</span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{collapsed ? '▶' : '▼'}</span>
      </button>

      {!collapsed && (
        <div style={{ padding: '12px 16px' }}>
          {tasks.map(task => (
            <ReviewCard
              key={task.id}
              task={task}
              people={people}
              onConfirm={onConfirm}
              onDismiss={onDismiss}
              onReassign={onReassign}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Review() {
  const { slug, authFetch, isAdmin, allProjects } = useProject()
  const navigate = useNavigate()

  const [tasks, setTasks]                     = useState([])
  const [peopleBySlug, setPeopleBySlug]       = useState({})
  const [pendingMeetings, setPendingMeetings] = useState([])
  const [projects, setProjects]               = useState([])
  const [loading, setLoading]                 = useState(true)

  // Redirect non-admins away
  useEffect(() => {
    if (!isAdmin) navigate(`/${slug}/tasks`, { replace: true })
  }, [isAdmin, slug])

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)

    const peopleRequests = allProjects.map(p =>
      authFetch(`/api/people?slug=${p.slug}`).then(r => r.json()).catch(() => [])
    )

    Promise.all([
      authFetch('/api/tasks?review=1&all=1').then(r => r.json()),
      authFetch('/api/fathom-meeting-queue').then(r => r.json()),
      ...peopleRequests,
    ]).then(([t, q, ...peopleSets]) => {
      setTasks(Array.isArray(t) ? t : [])
      setPendingMeetings(q.entries || [])
      setProjects(q.projects || [])
      const bySlug = {}
      allProjects.forEach((p, i) => { bySlug[p.slug] = peopleSets[i] || [] })
      setPeopleBySlug(bySlug)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug, authFetch, isAdmin])

  const removeTask    = id => setTasks(prev => prev.filter(t => t.id !== id))
  const removeMeeting = id => setPendingMeetings(prev => prev.filter(m => m.id !== id))

  const confirmTask = async task => {
    await authFetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...task, user_feedback: 'correct' }),
    })
    removeTask(task.id)
  }

  const dismissTask = async task => {
    await authFetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...task, is_archived: 1, user_feedback: 'not_a_task' }),
    })
    removeTask(task.id)
  }

  const reassignTask = async (task, person) => {
    await authFetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...task, assignee_id: person.id, assignee_name: person.name, user_feedback: 'correct' }),
    })
    removeTask(task.id)
  }

  const approveMeeting = async (entry, project_id) => {
    const res = await authFetch(`/api/fathom-meeting-queue/${entry.id}`, {
      method: 'PUT',
      body: JSON.stringify({ project_id }),
    })
    if (res.ok) removeMeeting(entry.id)
  }

  const rejectMeeting = async (entry) => {
    const res = await authFetch(`/api/fathom-meeting-queue/${entry.id}`, { method: 'DELETE' })
    if (res.ok) removeMeeting(entry.id)
  }

  // Group tasks by project
  const projectGroups = Object.values(
    tasks.reduce((acc, task) => {
      const ps = task.project_slug || 'unknown'
      if (!acc[ps]) acc[ps] = { project_name: task.project_name || ps, project_slug: ps, items: [] }
      acc[ps].items.push(task)
      return acc
    }, {})
  )

  const totalItems = pendingMeetings.length + tasks.length

  return (
    <Layout>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Needs Review</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              All clients — Fathom meetings awaiting assignment and tasks extracted with low confidence or unmatched assignees
            </div>
          </div>
          {!loading && (
            <span style={{ fontSize: 13, fontWeight: 700, color: totalItems > 0 ? '#d97706' : '#16a34a' }}>
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>}

        {!loading && totalItems === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>All caught up</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>No items need review right now.</div>
          </div>
        )}

        {/* ── Pending Fathom Meetings ──────────────────────────────────────── */}
        {!loading && pendingMeetings.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>🎙️ Pending Fathom Meetings</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  Attendees couldn't be matched to a client — assign to a project to create the meeting
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: '#6366f115', borderRadius: 12, padding: '2px 10px' }}>
                {pendingMeetings.length}
              </span>
            </div>
            {pendingMeetings.map(entry => (
              <PendingMeetingCard key={entry.id} entry={entry} projects={projects} onApprove={approveMeeting} onReject={rejectMeeting} />
            ))}
          </div>
        )}

        {/* ── Task Review Queue — grouped by client ────────────────────────── */}
        {!loading && tasks.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>📋 Task Review</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  Tasks extracted by Claude with low confidence or unmatched assignees, grouped by client
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', background: '#fef3c7', borderRadius: 12, padding: '2px 10px' }}>
                {tasks.length}
              </span>
            </div>
            {projectGroups.map(({ project_name, project_slug, items }) => (
              <ProjectSection
                key={project_slug}
                name={project_name}
                tasks={items}
                people={peopleBySlug[project_slug] || []}
                onConfirm={confirmTask}
                onDismiss={dismissTask}
                onReassign={reassignTask}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
