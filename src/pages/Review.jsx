import { useState, useEffect } from 'react'
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
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '16px 18px',
      marginBottom: 12,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{sourceIcon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3, lineHeight: 1.3 }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <ConfidenceBadge confidence={task.confidence} />
            {task.due_date && (
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Due {fmtDate(task.due_date)}</span>
            )}
            <PriorityPill priority={task.priority} />
          </div>
        </div>
      </div>

      {/* Assignee row */}
      <div style={{ marginBottom: 10 }}>
        {task.assignee_id ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Avatar name={task.assignee_name} {...personAv(task.assignee_name)} size={20} />
            <span style={{ fontSize: 12, color: 'var(--text)' }}>{task.assignee_name}</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, padding: '4px 8px', background: '#fef3c7', borderRadius: 6, display: 'inline-block' }}>
            ⚠️ Unmatched assignee
            {task.unmatched_assignee_name && (
              <span style={{ color: '#92400e', fontWeight: 600 }}> — {task.unmatched_assignee_name}</span>
            )}
            {task.unmatched_assignee_email && (
              <span style={{ color: '#92400e' }}> ({task.unmatched_assignee_email})</span>
            )}
            <span style={{ color: '#78350f', marginLeft: 4 }}>· Person needs to be created in Admin → People</span>
          </div>
        )}
      </div>

      {/* Source email info */}
      {task.email_from_name && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
          From <strong style={{ color: 'var(--text-muted)' }}>{task.email_from_name}</strong>
          {task.email_subject && <> · <em>{task.email_subject}</em></>}
          {task.email_received_at && <> · {new Date(task.email_received_at).toLocaleDateString()}</>}
        </div>
      )}

      {/* Source excerpt */}
      {task.source_excerpt && (
        <div style={{
          fontSize: 12,
          color: 'var(--text)',
          background: 'var(--surface-2)',
          borderLeft: '3px solid var(--accent)',
          padding: '8px 10px',
          borderRadius: '0 6px 6px 0',
          marginBottom: 8,
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}>
          "{task.source_excerpt}"
        </div>
      )}

      {/* Claude reasoning */}
      {task.claude_reasoning && (
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600 }}>Claude: </span>{task.claude_reasoning}
        </div>
      )}

      {/* Action buttons */}
      {reassigning ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            autoFocus
            value={selectedPerson}
            onChange={e => setSelectedPerson(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', flex: 1 }}
          >
            <option value="">— select assignee —</option>
            {people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <button
            onClick={handleReassign}
            disabled={!selectedPerson}
            style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}
          >Assign</button>
          <button
            onClick={() => setReassigning(false)}
            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer' }}
          >Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => onConfirm(task)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >✓ Confirm task</button>
          <button
            onClick={() => setReassigning(true)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer' }}
          >↩ Reassign</button>
          <button
            onClick={() => onDismiss(task)}
            style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >✕ Dismiss</button>
          {task.source_email_id && (
            <a
              href={`https://outlook.office.com/mail/deeplink?ItemID=${encodeURIComponent(task.source_email_id)}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >📧 Open in Outlook</a>
          )}
        </div>
      )}
    </div>
  )
}

export default function Review() {
  const { slug, authFetch } = useProject()
  const [tasks, setTasks]   = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      authFetch(`/api/tasks?slug=${slug}&review=1`).then(r => r.json()),
      authFetch(`/api/people?slug=${slug}`).then(r => r.json()),
    ]).then(([t, p]) => {
      setTasks(t)
      setPeople(p)
      setLoading(false)
    })
  }, [slug, authFetch])

  const removeTask = id => setTasks(prev => prev.filter(t => t.id !== id))

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
      body: JSON.stringify({
        ...task,
        assignee_id: person.id,
        assignee_name: person.name,
        user_feedback: 'correct',
      }),
    })
    removeTask(task.id)
  }

  return (
    <Layout>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Needs Review</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Tasks extracted by Claude with low confidence or unmatched assignees
            </div>
          </div>
          {!loading && (
            <span style={{ fontSize: 13, fontWeight: 700, color: tasks.length > 0 ? '#d97706' : '#16a34a' }}>
              {tasks.length} item{tasks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading…</div>}

        {!loading && tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>All caught up</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>No tasks need review right now.</div>
          </div>
        )}

        {!loading && tasks.map(task => (
          <ReviewCard
            key={task.id}
            task={task}
            people={people}
            onConfirm={confirmTask}
            onDismiss={dismissTask}
            onReassign={reassignTask}
          />
        ))}
      </div>
    </Layout>
  )
}
