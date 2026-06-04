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

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>All caught up</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>No items need review right now.</div>
    </div>
  )
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: active === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1,
            color: active === tab.key ? 'var(--text)' : 'var(--text-dim)',
            fontWeight: active === tab.key ? 700 : 400,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'inherit',
          }}
        >
          {tab.label}
          {tab.count > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: active === tab.key ? 'var(--accent)' : 'var(--surface-2)',
              color: active === tab.key ? '#fff' : 'var(--text-dim)',
              border: '1px solid var(--border)',
              borderRadius: 99, padding: '1px 7px',
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
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
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: '#fef3c7', color: '#d97706' }}>
          {tasks.length} item{tasks.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{collapsed ? '▶' : '▼'}</span>
      </button>

      {!collapsed && (
        <div style={{ padding: '12px 16px' }}>
          {tasks.map(task => (
            <ReviewCard key={task.id} task={task} people={people} onConfirm={onConfirm} onDismiss={onDismiss} onReassign={onReassign} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Partial Match Card ────────────────────────────────────────────────────────

function PartialMatchCard({ match, onUpdate, onDismiss }) {
  const { sender, person } = match
  const [submitting, setSubmitting] = useState(false)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '4px solid #f59e0b',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, background: '#6366f108', border: '1px solid #6366f120', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>From email</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sender.from_name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{sender.from_email}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{sender.email_count} email{sender.email_count !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-dim)', fontSize: 18 }}>→</div>
        <div style={{ flex: 1, background: '#16a34a08', border: '1px solid #16a34a20', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>In people table</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{person.name}</div>
          <div style={{ fontSize: 11, color: person.email ? 'var(--text-dim)' : '#d97706', marginTop: 1 }}>
            {person.email || '⚠️ no email'}
          </div>
          {person.client_name && (
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', marginTop: 3 }}>{person.client_name}</div>
          )}
          {person.role && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{person.role}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={async () => { setSubmitting(true); await onUpdate(person, sender); setSubmitting(false) }}
          disabled={submitting}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
        >
          {submitting ? 'Updating…' : '✓ Update record'}
        </button>
        <button
          onClick={() => onDismiss(person.id)}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          Not the same person
        </button>
      </div>
    </div>
  )
}

// ── New Person Card ───────────────────────────────────────────────────────────

function NewPersonCard({ sender, projects, onAdd, onSkip }) {
  const [selectedProject, setSelectedProject] = useState('')
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sender.from_name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
          {sender.from_email} · {sender.email_count} email{sender.email_count !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 180px', minWidth: 160 }}
        >
          <option value="">— assign to project —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.client_display_name ? `${p.client_display_name} · ` : ''}{p.name}
            </option>
          ))}
        </select>
        <input
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="Role (optional)"
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 140px', minWidth: 120 }}
        />
        <button
          onClick={async () => { setSubmitting(true); await onAdd(sender, selectedProject, role); setSubmitting(false) }}
          disabled={!selectedProject || submitting}
          style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: 'none', background: selectedProject ? '#6366f1' : '#e5e7eb', color: selectedProject ? '#fff' : '#9ca3af', cursor: selectedProject ? 'pointer' : 'not-allowed', fontWeight: 600 }}
        >
          {submitting ? 'Adding…' : '+ Add person'}
        </button>
        <button
          onClick={() => onSkip(sender.from_email)}
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          Skip
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Review() {
  const { slug, api, isAdmin, allProjects } = useProject()
  const navigate = useNavigate()

  const [activeTab, setActiveTab]                 = useState('tasks')
  const [tasks, setTasks]                         = useState([])
  const [peopleBySlug, setPeopleBySlug]           = useState({})
  const [pendingMeetings, setPendingMeetings]     = useState([])
  const [projects, setProjects]                   = useState([])
  const [partialMatches, setPartialMatches]       = useState([])
  const [newPeople, setNewPeople]                 = useState([])
  const [candidateProjects, setCandidateProjects] = useState([])
  const [loading, setLoading]                     = useState(true)

  // Emails tab — lazy loaded on first visit
  const [emailSnapshots, setEmailSnapshots]       = useState(null)
  const [analyzingGroup, setAnalyzingGroup]       = useState(null)
  const [emailAnalysisResult, setEmailAnalysisResult] = useState({})

  // Manual tab
  const [manualTaskText, setManualTaskText]           = useState('')
  const [manualTaskProjectId, setManualTaskProjectId] = useState('')
  const [manualTaskSubmitting, setManualTaskSubmitting] = useState(false)
  const [manualTaskResult, setManualTaskResult]       = useState(null)
  const [manualMeetingText, setManualMeetingText]         = useState('')
  const [manualMeetingProjectId, setManualMeetingProjectId] = useState('')
  const [manualMeetingSubmitting, setManualMeetingSubmitting] = useState(false)
  const [manualMeetingResult, setManualMeetingResult]     = useState(null)

  useEffect(() => {
    if (!isAdmin) navigate(`/${slug}/tasks`, { replace: true })
  }, [isAdmin, slug])

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)

    Promise.all([
      api.get('/api/tasks?review=1&all=1').catch(() => []),
      api.get('/api/admin/fathom-meeting-queue').catch(() => ({ entries: [], projects: [] })),
      api.get('/api/people-candidates').catch(() => ({ partialMatches: [], newPeople: [], projects: [] })),
      ...allProjects.map(p => api.get(`/api/people?slug=${p.slug}`).catch(() => [])),
    ]).then(([t, q, candidates, ...peopleSets]) => {
      setTasks(Array.isArray(t) ? t : [])
      setPendingMeetings(q.entries || [])
      setProjects(q.projects || [])
      setPartialMatches(candidates.partialMatches || [])
      setNewPeople(candidates.newPeople || [])
      setCandidateProjects(candidates.projects || [])
      const bySlug = {}
      allProjects.forEach((p, i) => { bySlug[p.slug] = peopleSets[i] || [] })
      setPeopleBySlug(bySlug)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug, api, isAdmin])

  // Lazy-load email snapshots only when the tab is first opened
  useEffect(() => {
    if (activeTab === 'emails' && emailSnapshots === null && isAdmin) {
      api.get('/api/admin/email-snapshots')
        .then(data => setEmailSnapshots(data))
        .catch(() => setEmailSnapshots({ groups: [], unmatched: [] }))
    }
  }, [activeTab, emailSnapshots, isAdmin, api])

  const removeTask    = id => setTasks(prev => prev.filter(t => t.id !== id))
  const removeMeeting = id => setPendingMeetings(prev => prev.filter(m => m.id !== id))

  const confirmTask = async task => {
    await api.put(`/api/tasks/${task.id}`, { ...task, user_feedback: 'correct' }).catch(() => null)
    removeTask(task.id)
  }

  const dismissTask = async task => {
    await api.put(`/api/tasks/${task.id}`, { ...task, is_archived: 1, user_feedback: 'not_a_task' }).catch(() => null)
    removeTask(task.id)
  }

  const reassignTask = async (task, person) => {
    await api.put(`/api/tasks/${task.id}`, { ...task, assignee_id: person.id, assignee_name: person.name, user_feedback: 'correct' }).catch(() => null)
    removeTask(task.id)
  }

  const approveMeeting = async (entry, project_id) => {
    try {
      await api.put(`/api/admin/fathom-meeting-queue/${entry.id}`, { project_id })
      removeMeeting(entry.id)
    } catch (err) {
      console.error('Failed to approve meeting:', err)
    }
  }

  const rejectMeeting = async (entry) => {
    try {
      await api.del(`/api/admin/fathom-meeting-queue/${entry.id}`)
      removeMeeting(entry.id)
    } catch (err) {
      console.error('Failed to reject meeting:', err)
    }
  }

  const updatePersonFromEmail = async (person, sender) => {
    try {
      await api.put(`/api/people/${person.id}`, {
        name: sender.from_name,
        email: sender.from_email,
        role: person.role,
        org_type: person.org_type,
        avatar_bg: person.avatar_bg,
        avatar_fg: person.avatar_fg,
        is_active: person.is_active ?? 1,
        user_id: person.user_id || null,
      })
      setPartialMatches(prev => prev.filter(m => m.person.id !== person.id))
    } catch (err) {
      console.error('Failed to update person:', err)
    }
  }

  const dismissMatch = personId => {
    setPartialMatches(prev => prev.filter(m => m.person.id !== personId))
  }

  const addNewPerson = async (sender, projectId, role) => {
    try {
      await api.post('/api/people', {
        project_id: parseInt(projectId, 10),
        name: sender.from_name,
        email: sender.from_email,
        role: role || null,
      })
      setNewPeople(prev => prev.filter(s => s.from_email !== sender.from_email))
    } catch (err) {
      console.error('Failed to add person:', err)
    }
  }

  const skipNewPerson = fromEmail => {
    setNewPeople(prev => prev.filter(s => s.from_email !== fromEmail))
  }

  const analyzeEmailGroup = async (messageIds, projectId, groupKey) => {
    setAnalyzingGroup(groupKey)
    setEmailAnalysisResult(prev => ({ ...prev, [groupKey]: null }))
    try {
      const result = await api.post('/api/admin/analyze-snapshots', { message_ids: messageIds, project_id: projectId })
      setEmailAnalysisResult(prev => ({ ...prev, [groupKey]: result }))
    } catch (err) {
      console.error('Email analysis failed:', err)
      setEmailAnalysisResult(prev => ({ ...prev, [groupKey]: { error: err.message } }))
    }
    setAnalyzingGroup(null)
  }

  const submitManualTasks = async () => {
    if (!manualTaskText.trim() || !manualTaskProjectId) return
    setManualTaskSubmitting(true)
    setManualTaskResult(null)
    try {
      const result = await api.post('/api/admin/analyze-text', { text: manualTaskText, project_id: parseInt(manualTaskProjectId, 10), type: 'tasks' })
      setManualTaskResult(result)
      setManualTaskText('')
    } catch (err) {
      setManualTaskResult({ error: err.message })
    }
    setManualTaskSubmitting(false)
  }

  const submitManualMeeting = async () => {
    if (!manualMeetingText.trim() || !manualMeetingProjectId) return
    setManualMeetingSubmitting(true)
    setManualMeetingResult(null)
    try {
      const result = await api.post('/api/admin/analyze-text', { text: manualMeetingText, project_id: parseInt(manualMeetingProjectId, 10), type: 'meeting' })
      setManualMeetingResult(result)
      setManualMeetingText('')
    } catch (err) {
      setManualMeetingResult({ error: err.message })
    }
    setManualMeetingSubmitting(false)
  }

  const projectGroups = Object.values(
    tasks.reduce((acc, task) => {
      const ps = task.project_slug || 'unknown'
      if (!acc[ps]) acc[ps] = { project_name: task.project_name || ps, project_slug: ps, items: [] }
      acc[ps].items.push(task)
      return acc
    }, {})
  )

  const tabs = [
    { key: 'meetings', label: '🎙️ Meetings', count: pendingMeetings.length },
    { key: 'tasks',    label: '📋 Tasks',    count: tasks.length },
    { key: 'people',   label: '👥 People',   count: partialMatches.length + newPeople.length },
    { key: 'emails',   label: '📧 Emails',   count: 0 },
    { key: 'manual',   label: '✏️ Manual',   count: 0 },
  ]
  const totalItems = pendingMeetings.length + tasks.length + partialMatches.length + newPeople.length

  return (
    <Layout>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Needs Review</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              All clients — meetings, tasks, and people awaiting review
            </div>
          </div>
          {!loading && (
            <span style={{ fontSize: 13, fontWeight: 700, color: totalItems > 0 ? '#d97706' : '#16a34a' }}>
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>}

        {!loading && (
          <>
            <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {/* ── Meetings tab ─────────────────────────────────────────────── */}
            {activeTab === 'meetings' && (
              pendingMeetings.length === 0
                ? <EmptyState />
                : pendingMeetings.map(entry => (
                    <PendingMeetingCard key={entry.id} entry={entry} projects={projects} onApprove={approveMeeting} onReject={rejectMeeting} />
                  ))
            )}

            {/* ── Tasks tab ────────────────────────────────────────────────── */}
            {activeTab === 'tasks' && (
              tasks.length === 0
                ? <EmptyState />
                : projectGroups.map(({ project_name, project_slug, items }) => (
                    <ProjectSection
                      key={project_slug}
                      name={project_name}
                      tasks={items}
                      people={peopleBySlug[project_slug] || []}
                      onConfirm={confirmTask}
                      onDismiss={dismissTask}
                      onReassign={reassignTask}
                    />
                  ))
            )}

            {/* ── People tab ───────────────────────────────────────────────── */}
            {activeTab === 'people' && (
              partialMatches.length === 0 && newPeople.length === 0
                ? <EmptyState />
                : <>
                    {partialMatches.length > 0 && (
                      <div style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Possible Matches</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                              Email senders who may be existing people with incomplete records
                            </div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: '#fef3c7', borderRadius: 12, padding: '2px 10px' }}>
                            {partialMatches.length}
                          </span>
                        </div>
                        {partialMatches.map(match => (
                          <PartialMatchCard key={match.person.id} match={match} onUpdate={updatePersonFromEmail} onDismiss={dismissMatch} />
                        ))}
                      </div>
                    )}

                    {newPeople.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>New People</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                              Email senders not yet in your people directory
                            </div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: '#6366f115', borderRadius: 12, padding: '2px 10px' }}>
                            {newPeople.length}
                          </span>
                        </div>
                        {newPeople.map(sender => (
                          <NewPersonCard
                            key={sender.from_email}
                            sender={sender}
                            projects={candidateProjects}
                            onAdd={addNewPerson}
                            onSkip={skipNewPerson}
                          />
                        ))}
                      </div>
                    )}
                  </>
            )}

            {/* ── Emails tab ───────────────────────────────────────────────── */}
            {activeTab === 'emails' && (
              emailSnapshots === null
                ? <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>
                : (() => {
                    const { groups = [], unmatched = [] } = emailSnapshots
                    if (groups.length === 0 && unmatched.length === 0) return <EmptyState />
                    const allGroups = [
                      ...groups.map(g => ({ ...g, key: String(g.project_id) })),
                      ...(unmatched.length > 0 ? [{ key: 'unmatched', project_name: 'Unmatched', client_domain: null, project_id: null, emails: unmatched }] : []),
                    ]
                    return allGroups.map(group => {
                      const groupKey = group.key
                      const result = emailAnalysisResult[groupKey]
                      const isAnalyzing = analyzingGroup === groupKey
                      return (
                        <div key={groupKey} style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{group.project_name}</span>
                              {group.client_domain && <span style={{ fontSize: 11, color: '#6366f1', marginLeft: 8 }}>@{group.client_domain}</span>}
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{group.emails.length} email{group.emails.length !== 1 ? 's' : ''}</span>
                            {group.project_id && (
                              <button
                                onClick={() => analyzeEmailGroup(group.emails.map(e => e.message_id), group.project_id, groupKey)}
                                disabled={isAnalyzing}
                                style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: 'none', background: isAnalyzing ? '#e5e7eb' : '#6366f1', color: isAnalyzing ? '#9ca3af' : '#fff', cursor: isAnalyzing ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                              >
                                {isAnalyzing ? 'Analyzing…' : `Analyze All (${group.emails.length})`}
                              </button>
                            )}
                          </div>
                          {result && (
                            <div style={{ padding: '8px 16px', background: result.error ? '#fef2f2' : '#f0fdf4', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                              {result.error
                                ? <span style={{ color: '#dc2626' }}>Error: {result.error}</span>
                                : <span style={{ color: '#16a34a' }}>✓ {result.tasks_added} task{result.tasks_added !== 1 ? 's' : ''} added · {result.tasks_for_review} for review · {result.completions_marked} completion{result.completions_marked !== 1 ? 's' : ''}</span>
                              }
                            </div>
                          )}
                          <div style={{ padding: '8px 16px' }}>
                            {group.emails.map(email => (
                              <div key={email.message_id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', lastChild: { borderBottom: 'none' } }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{email.subject || '(no subject)'}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                    {email.from_name && <span>{email.from_name} · </span>}
                                    {email.from_email} · {email.received_at ? new Date(email.received_at).toLocaleDateString() : ''}
                                  </div>
                                  {email.body_preview && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.body_preview}</div>}
                                </div>
                                {group.project_id && (
                                  <button
                                    onClick={() => analyzeEmailGroup([email.message_id], group.project_id, `${groupKey}_${email.message_id}`)}
                                    disabled={analyzingGroup === `${groupKey}_${email.message_id}`}
                                    style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
                                  >
                                    {analyzingGroup === `${groupKey}_${email.message_id}` ? '…' : 'Analyze'}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  })()
            )}

            {/* ── Manual tab ───────────────────────────────────────────────── */}
            {activeTab === 'manual' && (
              <div>
                {/* Task extraction */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Extract Tasks from Text</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14 }}>Paste any email, message, or notes — Claude will extract all action items.</div>
                  <textarea
                    value={manualTaskText}
                    onChange={e => setManualTaskText(e.target.value)}
                    placeholder="Paste email content or notes here…"
                    rows={8}
                    style={{ width: '100%', fontSize: 12, padding: '10px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={manualTaskProjectId}
                      onChange={e => setManualTaskProjectId(e.target.value)}
                      style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 200px' }}
                    >
                      <option value="">— select client —</option>
                      {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button
                      onClick={submitManualTasks}
                      disabled={!manualTaskText.trim() || !manualTaskProjectId || manualTaskSubmitting}
                      style={{ fontSize: 12, padding: '6px 16px', borderRadius: 6, border: 'none', background: manualTaskText.trim() && manualTaskProjectId ? '#6366f1' : '#e5e7eb', color: manualTaskText.trim() && manualTaskProjectId ? '#fff' : '#9ca3af', cursor: manualTaskText.trim() && manualTaskProjectId ? 'pointer' : 'not-allowed', fontWeight: 600, fontFamily: 'inherit' }}
                    >
                      {manualTaskSubmitting ? 'Analyzing…' : 'Extract Tasks'}
                    </button>
                  </div>
                  {manualTaskResult && (
                    <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 7, background: manualTaskResult.error ? '#fef2f2' : '#f0fdf4', fontSize: 12 }}>
                      {manualTaskResult.error
                        ? <span style={{ color: '#dc2626' }}>Error: {manualTaskResult.error}</span>
                        : <span style={{ color: '#16a34a' }}>✓ {manualTaskResult.tasks_added} task{manualTaskResult.tasks_added !== 1 ? 's' : ''} added to board · {manualTaskResult.tasks_for_review} sent to review queue</span>
                      }
                    </div>
                  )}
                </div>

                {/* Meeting creation */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '4px solid #6366f1', borderRadius: 10, padding: '18px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Create Meeting from Text</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14 }}>Paste a Fathom email, meeting notes, or any meeting summary — Claude will create the meeting record and extract tasks.</div>
                  <textarea
                    value={manualMeetingText}
                    onChange={e => setManualMeetingText(e.target.value)}
                    placeholder="Paste Fathom email or meeting notes here…"
                    rows={10}
                    style={{ width: '100%', fontSize: 12, padding: '10px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={manualMeetingProjectId}
                      onChange={e => setManualMeetingProjectId(e.target.value)}
                      style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: '1 1 200px' }}
                    >
                      <option value="">— select client —</option>
                      {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button
                      onClick={submitManualMeeting}
                      disabled={!manualMeetingText.trim() || !manualMeetingProjectId || manualMeetingSubmitting}
                      style={{ fontSize: 12, padding: '6px 16px', borderRadius: 6, border: 'none', background: manualMeetingText.trim() && manualMeetingProjectId ? '#6366f1' : '#e5e7eb', color: manualMeetingText.trim() && manualMeetingProjectId ? '#fff' : '#9ca3af', cursor: manualMeetingText.trim() && manualMeetingProjectId ? 'pointer' : 'not-allowed', fontWeight: 600, fontFamily: 'inherit' }}
                    >
                      {manualMeetingSubmitting ? 'Creating Meeting…' : 'Create Meeting'}
                    </button>
                  </div>
                  {manualMeetingResult && (
                    <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 7, background: manualMeetingResult.error ? '#fef2f2' : '#f0fdf4', fontSize: 12 }}>
                      {manualMeetingResult.error
                        ? <span style={{ color: '#dc2626' }}>Error: {manualMeetingResult.error}</span>
                        : <span style={{ color: '#16a34a' }}>✓ Meeting "{manualMeetingResult.meeting_title}" created · {manualMeetingResult.tasks_added} task{manualMeetingResult.tasks_added !== 1 ? 's' : ''} added · {manualMeetingResult.tasks_for_review} for review</span>
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
