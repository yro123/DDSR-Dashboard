import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { useProject } from '../context/ProjectContext'
import { useTheme } from '../context/ThemeContext'
import Avatar from '../components/Avatar'
import { StatusPill, CategoryPill, PriorityPill } from '../components/Pill'
import { STATUS_DOT } from '../data/constants'
import { useConfig } from '../context/ConfigContext'

function fmtDate(d) {
  if (!d) return ''
  try {
    const [, m, dy] = d.split('-')
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1] + ' ' + parseInt(dy)
  } catch { return '' }
}

function TaskEditForm({ task, people, workflows, statuses, priorities, onSave, onCancel, onArchive }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    assignee_name: task?.assignee_name || '',
    assignee_id: task?.assignee_id || '',
    workflow_id: task?.workflow_id || '',
    status: task?.status || 'Not Started',
    priority: task?.priority || '',
    due_date: task?.due_date || '',
    notes: task?.notes || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.title.trim()) return
    const person = people.find(p => p.name === form.assignee_name)
    onSave({ ...form, assignee_id: person?.id || null })
  }

  return (
    <div className="edit-form">
      <div className="edit-grid">
        <div className="field">
          <label>Task</label>
          <textarea value={form.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div className="field">
            <label>Assignee</label>
            <select value={form.assignee_name} onChange={e => set('assignee_name', e.target.value)}>
              <option value="">— select —</option>
              {people.map(p => <option key={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Workflow</label>
            <select value={form.workflow_id} onChange={e => set('workflow_id', e.target.value)}>
              <option value="">— select —</option>
              {workflows.map(w => <option key={w.id} value={w.id}>{w.short_name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="">— not set —</option>
              {priorities.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Due Date</label>
            <input type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)} />
          </div>
        </div>
      </div>
      <div className="field" style={{ marginBottom: 12 }}>
        <label>Notes</label>
        <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
      </div>
      <div className="form-btns">
        {task
          ? <button className="btn-arch" onClick={() => onArchive(task.id)}>Archive task</button>
          : <span style={{ flex: 1 }} />
        }
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-save" onClick={handleSave}>Save</button>
      </div>
    </div>
  )
}

const SOURCE_ICON = { email: '📧', fathom: '🎙️' }

function ConfidenceDot({ confidence }) {
  if (confidence == null) return null
  const color = confidence >= 0.85 ? 'var(--status-done)' : confidence >= 0.6 ? '#f59e0b' : 'var(--red, #ef4444)'
  return (
    <span title={`Confidence: ${Math.round(confidence * 100)}%`}
      style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
  )
}

function FeedbackButtons({ task, authFetch, onUpdate }) {
  const [busy, setBusy] = useState(false)
  const [showReasons, setShowReasons] = useState(false)

  const sendFeedback = async feedback => {
    setBusy(true)
    const res = await authFetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...task, user_feedback: feedback }),
    }).then(r => r.json())
    onUpdate(res)
    setBusy(false)
    setShowReasons(false)
  }

  const current = task.user_feedback
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Was this task correct?</span>
      <button
        disabled={busy}
        onClick={() => sendFeedback('correct')}
        style={{ fontSize: 13, background: current === 'correct' ? 'var(--status-done-bg)' : 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', color: current === 'correct' ? 'var(--status-done-col)' : 'var(--text)' }}
        title="Thumbs up — task was extracted correctly"
      >👍</button>
      <button
        disabled={busy}
        onClick={() => setShowReasons(v => !v)}
        style={{ fontSize: 13, background: current && current !== 'correct' ? 'var(--pri-high-bg, #fee2e2)' : 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', color: current && current !== 'correct' ? 'var(--pri-high-col, #b91c1c)' : 'var(--text)' }}
        title="Thumbs down — something was wrong"
      >👎</button>
      {showReasons && (
        <select autoFocus style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          defaultValue="" onChange={e => e.target.value && sendFeedback(e.target.value)}>
          <option value="">What was wrong?</option>
          <option value="wrong_assignee">Wrong assignee</option>
          <option value="not_a_task">Not actually a task</option>
          <option value="wrong_project">Wrong project</option>
          <option value="wrong_due_date">Wrong due date</option>
          <option value="duplicate">Duplicate task</option>
        </select>
      )}
    </div>
  )
}

export default function Tasks() {
  const { slug, authFetch } = useProject()
  const { dark } = useTheme()
  const { getOptions, getColor } = useConfig()
  const statuses   = getOptions('task_status')
  const priorities = getOptions('task_priority')
  const [tasks, setTasks]         = useState([])
  const [archived, setArchived]   = useState([])
  const [people, setPeople]       = useState([])
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading]     = useState(true)

  const [groupBy, setGroupBy]                 = useState('person')
  const [filterStatus, setFilterStatus]       = useState('')
  const [filterSourceType, setFilterSourceType] = useState('')
  const [filterSecondary, setFilterSecondary] = useState('')
  const [filterPrimary, setFilterPrimary]     = useState('')
  const [showAll, setShowAll]                 = useState(false)
  const [showArchive, setShowArchive]         = useState(false)
  const [openTaskId, setOpenTaskId]           = useState(null)
  const [addingNew, setAddingNew]             = useState(false)
  const [addingInGroup, setAddingInGroup]     = useState(null)
  const [collapsed, setCollapsed]             = useState({})
  const [bulkSelected, setBulkSelected]       = useState(new Set())

  useEffect(() => {
    setLoading(true)
    setArchived([])
    Promise.all([
      authFetch(`/api/tasks?slug=${slug}`).then(r => r.json()),
      authFetch(`/api/people?slug=${slug}`).then(r => r.json()),
      authFetch(`/api/workflows?slug=${slug}`).then(r => r.json()),
    ]).then(([t, p, w]) => {
      setTasks(t); setPeople(p); setWorkflows(w); setLoading(false)
      // auto-select first group on initial load
      setFilterPrimary(prev => prev || (groupBy === 'person'
        ? [...new Set(t.map(task => task.assignee_name).filter(Boolean))].sort()[0] || ''
        : (w[0]?.short_name || '')
      ))
    })
  }, [slug, authFetch])

  const reload = () => authFetch(`/api/tasks?slug=${slug}`).then(r => r.json()).then(setTasks)

  const personAv = name => {
    const p = people.find(p => p.name === name)
    return { bg: p?.avatar_bg || '#F3F4F6', fg: p?.avatar_fg || '#374151' }
  }

  const assigneeNames = [...new Set(tasks.map(t => t.assignee_name).filter(Boolean))].sort()
  const workflowNames = workflows.map(w => w.short_name)

  // forCards: ignores filterPrimary so all stat tiles always show with real counts
  const forCards = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false
    if (filterSourceType && (t.source_type || 'manual') !== filterSourceType) return false
    if (filterSecondary) {
      if (groupBy === 'person'   && t.workflow_name  !== filterSecondary) return false
      if (groupBy === 'workflow' && t.assignee_name  !== filterSecondary) return false
    }
    return true
  })

  const visible = forCards.filter(t => {
    if (filterPrimary && !showAll) {
      if (groupBy === 'person'   && t.assignee_name !== filterPrimary) return false
      if (groupBy === 'workflow' && t.workflow_name  !== filterPrimary) return false
    }
    return true
  })

  const groupKeys = groupBy === 'person' ? assigneeNames : workflowNames

  const changeGroup = g => {
    setGroupBy(g); setFilterSecondary(''); setFilterPrimary(''); setFilterSourceType(''); setShowAll(false); setOpenTaskId(null)
  }

  const toggleArchiveView = async () => {
    if (!showArchive && archived.length === 0) {
      const data = await authFetch(`/api/tasks?slug=${slug}&archived=1`).then(r => r.json())
      setArchived(data)
    }
    setShowArchive(v => !v)
  }

  const createTask = async data => {
    const res = await authFetch('/api/tasks', {
      method: 'POST', body: JSON.stringify({ slug, ...data }),
    }).then(r => r.json())
    setTasks(prev => [...prev, res])
    setAddingNew(false)
  }

  const updateTask = async (id, data) => {
    const res = await authFetch(`/api/tasks/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }).then(r => r.json())
    setTasks(prev => prev.map(t => t.id === id ? res : t))
    setOpenTaskId(null)
  }

  const archiveTask = async id => {
    const task = tasks.find(t => t.id === id)
    await authFetch(`/api/tasks/${id}`, {
      method: 'PUT', body: JSON.stringify({ ...task, is_archived: 1 }),
    })
    setTasks(prev => prev.filter(t => t.id !== id))
    setArchived(prev => [...prev, { ...task, is_archived: 1 }])
    setOpenTaskId(null)
  }

  const restoreTask = async id => {
    const task = archived.find(t => t.id === id)
    const res = await authFetch(`/api/tasks/${id}`, {
      method: 'PUT', body: JSON.stringify({ ...task, is_archived: 0, archived_at: null }),
    }).then(r => r.json())
    setArchived(prev => prev.filter(t => t.id !== id))
    setTasks(prev => [...prev, res])
  }

  const cycleStatus = async id => {
    const task = tasks.find(t => t.id === id)
    const next = statuses[(statuses.indexOf(task.status) + 1) % statuses.length]
    if (next === 'Done') { await archiveTask(id) }
    else { await updateTask(id, { ...task, status: next }) }
  }

  const toggleBulk = (id, checked) => {
    setBulkSelected(prev => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  const applyBulk = async (field, value) => {
    if (!value) return
    await Promise.all([...bulkSelected].map(id => {
      const task = tasks.find(t => t.id === id)
      return authFetch(`/api/tasks/${id}`, {
        method: 'PUT', body: JSON.stringify({ ...task, [field]: value }),
      })
    }))
    await reload()
    setBulkSelected(new Set())
  }

  const bulkArchive = async () => {
    if (!confirm(`Archive ${bulkSelected.size} task(s)?`)) return
    await Promise.all([...bulkSelected].map(id => {
      const task = tasks.find(t => t.id === id)
      return authFetch(`/api/tasks/${id}`, {
        method: 'PUT', body: JSON.stringify({ ...task, is_archived: 1 }),
      })
    }))
    setTasks(prev => prev.filter(t => !bulkSelected.has(t.id)))
    setBulkSelected(new Set())
  }

  const toggleAllGroups = () => {
    const allCollapsed = groupKeys.every(k => collapsed[k])
    const next = {}
    groupKeys.forEach(k => { next[k] = !allCollapsed })
    setCollapsed(next)
  }

  if (loading) return <Layout><div style={{ padding: 40, color: 'var(--text-dim)' }}>Loading…</div></Layout>

  return (
    <Layout>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, flexShrink: 0 }}>
        <div className="toggle">
          <button className={groupBy === 'person'   ? 'on' : ''} onClick={() => changeGroup('person')}>By person</button>
          <button className={groupBy === 'workflow' ? 'on' : ''} onClick={() => changeGroup('workflow')}>By workflow</button>
        </div>
        <select className="sel" value={filterSecondary} onChange={e => { setFilterSecondary(e.target.value); setFilterPrimary('') }}>
          <option value="">{groupBy === 'person' ? 'All workflows' : 'All people'}</option>
          {groupBy === 'person'
            ? workflowNames.map(n => <option key={n}>{n}</option>)
            : assigneeNames.map(n => <option key={n}>{n}</option>)
          }
        </select>
        <select className="sel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="sel" value={filterSourceType} onChange={e => setFilterSourceType(e.target.value)}>
          <option value="">All sources</option>
          <option value="manual">✏️ Manual</option>
          <option value="email">📧 Email</option>
          <option value="fathom">🎙️ Fathom</option>
        </select>
        <button className={`btn${showArchive ? ' btn-active' : ''}`} onClick={toggleArchiveView}>
          {showArchive ? '◀ Back' : `Archive (${archived.length})`}
        </button>
        <button className={`btn${showAll ? ' btn-active' : ''}`} onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Collapse' : 'View All'}
        </button>
      </div>

      {/* Stats row */}
      {!showArchive && (
        <div style={{ flexShrink: 0 }}>
          <div className="stats-label">Tasks per {groupBy === 'person' ? 'assignee' : 'workflow'}</div>
          <div className="stats">
            {groupKeys.map(key => {
              const count = forCards.filter(t => groupBy === 'person' ? t.assignee_name === key : t.workflow_name === key).length
              if (!count) return null
              const { bg, fg } = groupBy === 'person'
                ? personAv(key)
                : { bg: workflows.find(w => w.short_name === key)?.bg_color || 'var(--surface-2)', fg: workflows.find(w => w.short_name === key)?.color || 'var(--text-muted)' }
              const active = filterPrimary === key
              return (
                <div key={key} className="stat-card"
                  style={{ borderLeft: `3px solid ${fg}`, background: dark ? fg + '18' : bg }}
                  onClick={() => { setFilterPrimary(key); setShowAll(false) }}>
                  <div className="stat-n" style={{ color: fg }}>{count}</div>
                  <div className="stat-l" style={{ color: fg }}>{key}</div>
                </div>
              )
            })}
            <div className="stat-card">
              <div className="stat-n">{forCards.length}</div>
              <div className="stat-l" style={{ color: 'var(--text-muted)' }}>Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Archive view */}
      {showArchive && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>Archived ({archived.length})</div>
          {archived.length === 0 && <div className="empty">No archived tasks.</div>}
          {archived.map(t => {
            const { bg, fg } = personAv(t.assignee_name)
            return (
              <div key={t.id} className="arch-row">
                <Avatar name={t.assignee_name} bg={bg} fg={fg} size={20} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80 }}>{t.assignee_name}</span>
                <span style={{ fontSize: 11, flex: 1, color: 'var(--text-muted)' }}>{t.title}</span>
                <StatusPill status={t.status} />
                {t.workflow_color && <CategoryPill name={t.workflow_name} color={t.workflow_color} />}
                <button className="btn" style={{ height: 24, fontSize: 10 }} onClick={() => restoreTask(t.id)}>Restore</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add form */}
      {addingNew && !showArchive && (
        <div style={{ marginBottom: 12 }}>
          <TaskEditForm
            task={null}
            people={people}
            workflows={workflows}
            statuses={statuses}
            priorities={priorities}
            onSave={createTask}
            onCancel={() => setAddingNew(false)}
            onArchive={() => {}}
          />
        </div>
      )}

      {/* Bulk bar */}
      {bulkSelected.size > 0 && (
        <div className="bulk-bar" style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{bulkSelected.size} task{bulkSelected.size > 1 ? 's' : ''} selected</span>
          <select className="bulk-sel" onChange={e => { applyBulk('status', e.target.value); e.target.value = '' }} defaultValue="">
            <option value="">Change status…</option>
            {statuses.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="bulk-sel" onChange={e => { applyBulk('priority', e.target.value); e.target.value = '' }} defaultValue="">
            <option value="">Change priority…</option>
            {priorities.map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="bulk-sel" onChange={e => { applyBulk('assignee_name', e.target.value); e.target.value = '' }} defaultValue="">
            <option value="">Reassign to…</option>
            {assigneeNames.map(n => <option key={n}>{n}</option>)}
          </select>
          <button className="bulk-btn" style={{ background: 'var(--red)', color: '#fff' }} onClick={bulkArchive}>Archive</button>
          <button className="bulk-btn" onClick={() => setBulkSelected(new Set())}>✕ Clear</button>
        </div>
      )}

      {/* Task groups */}
      {!showArchive && (
        <>
          {visible.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, flexShrink: 0 }}>
              <button className="btn" style={{ height: 26, fontSize: 11 }} onClick={toggleAllGroups}>
                {groupKeys.every(k => collapsed[k]) ? '⊞ Expand all' : '⊟ Collapse all'}
              </button>
            </div>
          )}
          <div className="tasks-scroll-area">
          {groupKeys.map(key => {
            const gTasks = visible.filter(t => groupBy === 'person' ? t.assignee_name === key : t.workflow_name === key)
            if (!gTasks.length) return null
            // In single-person view, only render the selected group
            const activeKey = showAll ? null : (filterPrimary || groupKeys[0])
            if (activeKey && key !== activeKey) return null
            const wf = groupBy === 'workflow' ? workflows.find(w => w.short_name === key) : null
            const { bg, fg } = groupBy === 'person'
              ? personAv(key)
              : { bg: wf?.bg_color || 'var(--surface-2)', fg: wf?.color || 'var(--text)' }
            const ip = gTasks.filter(t => t.status === 'In Progress').length
            const dn = gTasks.filter(t => t.status === 'Done').length
            const ns = gTasks.filter(t => t.status === 'Not Started').length
            const pct = gTasks.length ? Math.round((dn / gTasks.length) * 100) : 0
            const isCollapsed = collapsed[key]

            return (
              <div key={key} className="group" style={{ borderColor: fg + '50' }}>
                <div className="group-hdr" style={{ background: dark ? 'var(--surface-2)' : bg }}>
                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                    onClick={() => setCollapsed(c => ({ ...c, [key]: !c[key] }))}
                  >
                    {groupBy === 'person'
                      ? <Avatar name={key} bg={bg} fg={fg} size={26} />
                      : <span style={{ width: 8, height: 8, borderRadius: '50%', background: fg, flexShrink: 0, display: 'inline-block' }} />
                    }
                    <span className="group-name" style={{ color: groupBy === 'person' ? 'var(--text)' : fg }}>{key}</span>
                    <span className="group-count">{gTasks.length} tasks</span>
                    {ip > 0 && <span className="badge" style={{ background: 'var(--status-ip-bg)',   color: 'var(--status-ip-col)' }}>{ip} active</span>}
                    {dn > 0 && <span className="badge" style={{ background: 'var(--status-done-bg)', color: 'var(--status-done-col)' }}>{dn} done</span>}
                    {ns > 0 && <span className="badge" style={{ background: 'var(--status-ns-bg)',   color: 'var(--status-ns-col)' }}>{ns} pending</span>}
                    <div className="group-progress" title={`${pct}% complete`}>
                      <div className="group-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 4 }}>{isCollapsed ? '▶' : '▼'}</span>
                  </button>
                  <button
                    className="group-add-btn"
                    onClick={e => { e.stopPropagation(); setAddingInGroup(key); setOpenTaskId(null) }}
                  >+ Add</button>
                </div>

                {/* In-group add form */}
                {!isCollapsed && addingInGroup === key && (
                  <TaskEditForm
                    task={null}
                    people={people}
                    workflows={workflows}
                    statuses={statuses}
                    priorities={priorities}
                    onSave={data => {
                      const prefill = groupBy === 'person'
                        ? { assignee_name: key }
                        : { workflow_id: workflows.find(w => w.short_name === key)?.id || '' }
                      createTask({ ...prefill, ...data })
                      setAddingInGroup(null)
                    }}
                    onCancel={() => setAddingInGroup(null)}
                    onArchive={() => {}}
                  />
                )}

                {!isCollapsed && gTasks.map(t => {
                  const isOpen    = openTaskId === t.id
                  const isChecked = bulkSelected.has(t.id)
                  const { bg: avBg, fg: avFg } = personAv(t.assignee_name)

                  return (
                    <div key={t.id}>
                      <div style={{
                        display: 'flex', alignItems: 'stretch',
                        borderBottom: '1px solid var(--border)',
                        background: isChecked ? 'var(--accent-dim)' : 'transparent',
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', padding: '0 6px 0 12px', cursor: 'pointer', flexShrink: 0 }}
                          onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isChecked}
                            onChange={e => toggleBulk(t.id, e.target.checked)}
                            style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--accent)' }} />
                        </label>
                        <button
                          className={`task-row${isOpen ? ' open' : ''}`}
                          style={{ opacity: t.status === 'Done' ? 0.45 : 1, flex: 1, border: 'none', borderBottom: 'none', padding: '10px 10px 10px 4px' }}
                          onClick={() => setOpenTaskId(isOpen ? null : t.id)}>
                          <span className="dot-status"
                            style={{ background: getColor('task_status', t.status) || STATUS_DOT[t.status] || 'var(--border-mid)' }}
                            onClick={e => { e.stopPropagation(); cycleStatus(t.id) }}
                            title="Click to cycle status" />
                          <span className="task-text">{t.title}</span>
                          <span className="task-date">{fmtDate(t.due_date)}</span>
                          <StatusPill status={t.status} color={getColor('task_status', t.status)} />
                          {groupBy === 'person'
                            ? t.workflow_color && <CategoryPill name={t.workflow_name} color={t.workflow_color} />
                            : <><Avatar name={t.assignee_name} bg={avBg} fg={avFg} size={20} />
                               <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80, textAlign: 'left' }}>{t.assignee_name}</span></>
                          }
                          <PriorityPill priority={t.priority} color={getColor('task_priority', t.priority)} />
                          {t.source_type && t.source_type !== 'manual' && (
                            <span title={`Source: ${t.source_type}`} style={{ fontSize: 13, lineHeight: 1 }}>
                              {SOURCE_ICON[t.source_type] || '📄'}
                            </span>
                          )}
                          <ConfidenceDot confidence={t.confidence} />
                          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{isOpen ? '▲' : '▼'}</span>
                        </button>
                      </div>
                      {isOpen && (
                        <div>
                          {t.source_type && t.source_type !== 'manual' && (
                            <FeedbackButtons
                              task={t}
                              authFetch={authFetch}
                              onUpdate={updated => setTasks(prev => prev.map(x => x.id === updated.id ? updated : x))}
                            />
                          )}
                          <TaskEditForm
                            task={t}
                            people={people}
                            workflows={workflows}
                            statuses={statuses}
                            priorities={priorities}
                            onSave={data => updateTask(t.id, { ...t, ...data })}
                            onCancel={() => setOpenTaskId(null)}
                            onArchive={archiveTask}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
          </div>{/* end tasks-scroll-area */}
          {visible.length === 0 && !addingNew && (
            <div className="empty">No tasks match current filters.</div>
          )}
        </>
      )}
    </div>
    </Layout>
  )
}
