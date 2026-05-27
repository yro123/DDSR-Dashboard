import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useProject } from '../context/ProjectContext'
import { useConfig } from '../context/ConfigContext'

function fmtDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_COLORS = {
  'Pending':   { bg: '#FEF3C720', col: '#D97706', border: '#FCD34D' },
  'In Review': { bg: '#EEF2FF',   col: '#6366F1', border: '#A5B4FC' },
  'Approved':  { bg: '#F0FDF4',   col: '#16A34A', border: '#86EFAC' },
  'Rejected':  { bg: '#FEF2F2',   col: '#DC2626', border: '#FCA5A5' },
  'Deferred':  { bg: '#F8FAFC',   col: '#64748B', border: '#CBD5E1' },
}

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS['Pending']
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
      background: s.bg, color: s.col, border: `1px solid ${s.border}`,
      textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
    }}>{status}</span>
  )
}

function PriorityDot({ priority, getColor }) {
  const color = getColor('ticket_priority', priority) || '#94A3B8'
  return (
    <span title={priority} style={{
      width: 8, height: 8, borderRadius: '50%', background: color,
      display: 'inline-block', flexShrink: 0,
    }} />
  )
}

function CategoryPill({ category, getColor }) {
  const color = getColor('ticket_category', category) || '#94A3B8'
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
      background: color + '20', color, whiteSpace: 'nowrap',
    }}>{category}</span>
  )
}

function SubmitForm({ workflows, people, onSubmit, onCancel, categories, priorities }) {
  const [form, setForm] = useState({
    title: '', description: '', category: categories[0] || 'Other',
    priority: 'Normal', workflow_id: '', requested_due_date: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) return
    setSaving(true)
    await onSubmit(form)
    setSaving(false)
  }

  return (
    <div className="edit-form" style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>New Request</div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label>Title <span style={{ color: 'var(--red)' }}>*</span></label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief summary of your request" />
      </div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label>Description <span style={{ color: 'var(--red)' }}>*</span></label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="What do you need and why? Include any relevant context or urgency."
          style={{ minHeight: 80 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 140 }}>
          <label>Priority</label>
          <select value={form.priority} onChange={e => set('priority', e.target.value)}>
            {priorities.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>Related Workflow (optional)</label>
          <select value={form.workflow_id} onChange={e => set('workflow_id', e.target.value)}>
            <option value="">— none —</option>
            {workflows.map(w => <option key={w.id} value={w.id}>{w.short_name}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>Requested Completion (optional)</label>
          <input type="date" value={form.requested_due_date} onChange={e => set('requested_due_date', e.target.value)} />
        </div>
      </div>
      <div className="form-btns">
        <span style={{ flex: 1 }} />
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button
          className="btn-save"
          onClick={handleSubmit}
          disabled={saving || !form.title.trim() || !form.description.trim()}
        >
          {saving ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </div>
  )
}

function ApprovePanel({ ticket, people, workflows, onConfirm, onCancel }) {
  const [form, setForm] = useState({
    task_workflow_id: ticket.workflow_id || '',
    task_assignee_id: '',
    task_due_date: ticket.requested_due_date || '',
    reviewer_notes: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    await onConfirm(form)
    setSaving(false)
  }

  return (
    <div style={{
      marginTop: 12, padding: 14, background: '#F0FDF4',
      border: '1px solid #86EFAC', borderRadius: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', marginBottom: 10 }}>
        Configure Task
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <div className="field" style={{ flex: 1, minWidth: 150 }}>
          <label>Workflow</label>
          <select value={form.task_workflow_id} onChange={e => set('task_workflow_id', e.target.value)}>
            <option value="">— none —</option>
            {workflows.map(w => <option key={w.id} value={w.id}>{w.short_name}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 150 }}>
          <label>Assignee</label>
          <select value={form.task_assignee_id} onChange={e => set('task_assignee_id', e.target.value)}>
            <option value="">— unassigned —</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 150 }}>
          <label>Due Date</label>
          <input type="date" value={form.task_due_date} onChange={e => set('task_due_date', e.target.value)} />
        </div>
      </div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label>Reviewer Notes (optional)</label>
        <textarea value={form.reviewer_notes} onChange={e => set('reviewer_notes', e.target.value)}
          placeholder="Internal notes…" style={{ minHeight: 48 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={saving} style={{
          padding: '6px 16px', borderRadius: 7, border: 'none',
          background: '#16A34A', color: '#fff', fontWeight: 700,
          fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
        }}>{saving ? 'Creating…' : 'Create Task'}</button>
        <button onClick={onCancel} style={{
          padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text-muted)',
          fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  )
}

function RejectPanel({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    await onConfirm(reason)
    setSaving(false)
  }

  return (
    <div style={{
      marginTop: 12, padding: 14, background: '#FEF2F2',
      border: '1px solid #FCA5A5', borderRadius: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>
        Rejection Reason
      </div>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Explain why this request is being rejected (visible to submitter)…"
        style={{ width: '100%', minHeight: 64, marginBottom: 10, boxSizing: 'border-box' }}
        className="field"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={saving} style={{
          padding: '6px 16px', borderRadius: 7, border: 'none',
          background: '#DC2626', color: '#fff', fontWeight: 700,
          fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
        }}>{saving ? '…' : 'Confirm Reject'}</button>
        <button onClick={onCancel} style={{
          padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text-muted)',
          fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  )
}

function DeferPanel({ onConfirm, onCancel }) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    await onConfirm(notes)
    setSaving(false)
  }

  return (
    <div style={{
      marginTop: 12, padding: 14, background: '#F8FAFC',
      border: '1px solid var(--border)', borderRadius: 8,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
        Defer — Notes (optional)
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Why is this being deferred? (optional)"
        style={{ width: '100%', minHeight: 48, marginBottom: 10, boxSizing: 'border-box' }}
        className="field"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={saving} style={{
          padding: '6px 16px', borderRadius: 7, border: 'none',
          background: 'var(--text-muted)', color: '#fff', fontWeight: 700,
          fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
        }}>{saving ? '…' : 'Confirm Defer'}</button>
        <button onClick={onCancel} style={{
          padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text-muted)',
          fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  )
}

function TicketRow({ ticket, isAdmin, authFetch, onUpdate, people, workflows, getColor }) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState(null) // 'approve' | 'reject' | 'defer'
  const [acting, setActing] = useState(false)

  const transition = async (status, extra = {}) => {
    setActing(true)
    const res = await authFetch(`/api/tickets/${ticket.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...extra }),
    }).then(r => r.json())
    onUpdate(res.ticket || res)
    setPanel(null)
    setActing(false)
  }

  const isResolved = ['Approved', 'Rejected', 'Deferred'].includes(ticket.status)

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Row */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '12px 16px', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <PriorityDot priority={ticket.priority} getColor={getColor} />
        <CategoryPill category={ticket.category} getColor={getColor} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {ticket.title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
          {ticket.submitted_by_name || 'Unknown'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
          {fmtDate(ticket.created_at)}
        </span>
        <StatusBadge status={ticket.status} />
        <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '0 16px 16px 40px' }}>
          <div style={{
            fontSize: 13, color: 'var(--text)', lineHeight: 1.6,
            padding: '10px 14px', background: 'var(--surface-2)',
            borderRadius: 8, marginBottom: 10, whiteSpace: 'pre-wrap',
          }}>
            {ticket.description}
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 10 }}>
            {ticket.workflow_name && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Workflow: </span>{ticket.workflow_name}
              </div>
            )}
            {ticket.requested_due_date && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Requested by: </span>{ticket.requested_due_date}
              </div>
            )}
            {ticket.reviewed_by && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Reviewed by: </span>
                {ticket.reviewed_by} on {fmtDate(ticket.reviewed_at)}
              </div>
            )}
            {ticket.task_id && (
              <div style={{ fontSize: 11 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 99, background: '#F0FDF4',
                  color: '#16A34A', fontWeight: 700, fontSize: 10,
                }}>✓ Task #{ticket.task_id} created</span>
              </div>
            )}
          </div>

          {ticket.rejection_reason && (
            <div style={{
              padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5',
              borderRadius: 8, fontSize: 12, color: '#DC2626', marginBottom: 10,
            }}>
              <strong>Rejection reason:</strong> {ticket.rejection_reason}
            </div>
          )}

          {ticket.reviewer_notes && (
            <div style={{
              padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 10,
            }}>
              <strong>Notes:</strong> {ticket.reviewer_notes}
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && !isResolved && (
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                {ticket.status !== 'In Review' && (
                  <button
                    onClick={() => transition('In Review')}
                    disabled={acting}
                    style={{
                      padding: '5px 12px', borderRadius: 7, border: '1px solid #A5B4FC',
                      background: '#EEF2FF', color: '#6366F1', fontSize: 12,
                      fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >Mark In Review</button>
                )}
                <button
                  onClick={() => setPanel(panel === 'approve' ? null : 'approve')}
                  style={{
                    padding: '5px 12px', borderRadius: 7, border: '1px solid #86EFAC',
                    background: panel === 'approve' ? '#F0FDF4' : 'var(--surface)',
                    color: '#16A34A', fontSize: 12, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >Approve →</button>
                <button
                  onClick={() => setPanel(panel === 'reject' ? null : 'reject')}
                  style={{
                    padding: '5px 12px', borderRadius: 7, border: '1px solid #FCA5A5',
                    background: panel === 'reject' ? '#FEF2F2' : 'var(--surface)',
                    color: '#DC2626', fontSize: 12, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >Reject</button>
                <button
                  onClick={() => setPanel(panel === 'defer' ? null : 'defer')}
                  style={{
                    padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border-mid)',
                    background: 'var(--surface)', color: 'var(--text-muted)',
                    fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >Defer</button>
              </div>

              {panel === 'approve' && (
                <ApprovePanel
                  ticket={ticket}
                  people={people}
                  workflows={workflows}
                  onConfirm={form => transition('Approved', form)}
                  onCancel={() => setPanel(null)}
                />
              )}
              {panel === 'reject' && (
                <RejectPanel
                  onConfirm={reason => transition('Rejected', { rejection_reason: reason })}
                  onCancel={() => setPanel(null)}
                />
              )}
              {panel === 'defer' && (
                <DeferPanel
                  onConfirm={notes => transition('Deferred', { reviewer_notes: notes })}
                  onCancel={() => setPanel(null)}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Requests() {
  const { slug, authFetch, isAdmin } = useProject()
  const { getOptions, getColor } = useConfig()

  const categories = getOptions('ticket_category')
  const priorities = getOptions('ticket_priority')
  const statuses   = getOptions('ticket_status')

  const [tickets, setTickets]     = useState([])
  const [people, setPeople]       = useState([])
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading]     = useState(true)
  const [addingNew, setAddingNew] = useState(false)

  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      authFetch(`/api/tickets?slug=${slug}`).then(r => r.json()),
      authFetch(`/api/people?slug=${slug}`).then(r => r.json()),
      authFetch(`/api/workflows?slug=${slug}`).then(r => r.json()),
    ]).then(([t, p, w]) => {
      setTickets(Array.isArray(t) ? t : [])
      setPeople(Array.isArray(p) ? p : [])
      setWorkflows(Array.isArray(w) ? w : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  const submitTicket = async form => {
    const res = await authFetch('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ slug, ...form }),
    }).then(r => r.json())
    setTickets(prev => [res, ...prev])
    setAddingNew(false)
  }

  const updateTicket = updated => {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const visible = tickets.filter(t => {
    if (filterStatus   && t.status   !== filterStatus)   return false
    if (filterCategory && t.category !== filterCategory) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const pendingCount = tickets.filter(t => t.status === 'Pending').length

  if (loading) return <Layout><div style={{ padding: 40, color: 'var(--text-dim)' }}>Loading…</div></Layout>

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, flexShrink: 0 }}>
          <select className="sel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="sel" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="sel" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All priorities</option>
            {priorities.map(p => <option key={p}>{p}</option>)}
          </select>
          {isAdmin && pendingCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
              background: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D',
            }}>{pendingCount} pending</span>
          )}
          <button
            onClick={() => setAddingNew(v => !v)}
            style={{
              marginLeft: 'auto', padding: '6px 16px', borderRadius: 8, border: 'none',
              background: '#00D4C8', color: '#0A0A0A', fontWeight: 700, fontSize: 13,
              fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0,
            }}
          >{addingNew ? '✕ Cancel' : '+ New Request'}</button>
        </div>

        {/* Submission form */}
        {addingNew && (
          <SubmitForm
            workflows={workflows}
            people={people}
            categories={categories}
            priorities={priorities}
            onSubmit={submitTicket}
            onCancel={() => setAddingNew(false)}
          />
        )}

        {/* Ticket list */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, overflow: 'hidden', flex: 1,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 16px', background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ width: 8 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', width: 100 }}>Category</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', flex: 1 }}>Title</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', width: 100 }}>Submitted by</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', width: 90 }}>Date</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', width: 80 }}>Status</span>
            <span style={{ width: 16 }} />
          </div>

          {visible.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
              {tickets.length === 0 ? 'No requests yet. Be the first to submit one.' : 'No requests match the current filters.'}
            </div>
          ) : (
            visible.map(t => (
              <TicketRow
                key={t.id}
                ticket={t}
                isAdmin={isAdmin}
                authFetch={authFetch}
                onUpdate={updateTicket}
                people={people}
                workflows={workflows}
                getColor={getColor}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
