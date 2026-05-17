import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { useProject } from '../context/ProjectContext'
import Avatar from '../components/Avatar'
import { StatusPill, CategoryPill, PriorityPill } from '../components/Pill'
import { STATUS_DOT, STATUSES, PRIORITIES } from '../data/constants'

function fmtDate(d) {
  if (!d) return ''
  try {
    const [, m, dy] = d.split('-')
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1] + ' ' + parseInt(dy)
  } catch { return '' }
}

function TaskEditForm({ task, people, workflows, onSave, onCancel, onArchive }) {
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
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="">— not set —</option>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
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

export default function Tasks() {
  const { slug, authFetch } = useProject()
  const [tasks, setTasks]         = useState([])
  const [archived, setArchived]   = useState([])
  const [people, setPeople]       = useState([])
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading]     = useState(true)

  const [groupBy, setGroupBy]               = useState('person')
  const [filterStatus, setFilterStatus]     = useState('')
  const [filterSecondary, setFilterSecondary] = useState('')
  const [filterPrimary, setFilterPrimary]   = useState('')
  const [showArchive, setShowArchive]       = useState(false)
  const [openTaskId, setOpenTaskId]         = useState(null)
  const [addingNew, setAddingNew]           = useState(false)
  const [collapsed, setCollapsed]           = useState({})
  const [bulkSelected, setBulkSelected]     = useState(new Set())

  useEffect(() => {
    setLoading(true)
    setArchived([])
    Promise.all([
      authFetch(`/api/tasks?slug=${slug}`).then(r => r.json()),
      authFetch(`/api/people?slug=${slug}`).then(r => r.json()),
      authFetch(`/api/workflows?slug=${slug}`).then(r => r.json()),
    ]).then(([t, p, w]) => {
      setTasks(t); setPeople(p); setWorkflows(w); setLoading(false)
    })
  }, [slug, authFetch])

  const reload = () => authFetch(`/api/tasks?slug=${slug}`).then(r => r.json()).then(setTasks)

  const personAv = name => {
    const p = people.find(p => p.name === name)
    return { bg: p?.avatar_bg || '#F3F4F6', fg: p?.avatar_fg || '#374151' }
  }

  const assigneeNames = [...new Set(tasks.map(t => t.assignee_name).filter(Boolean))].sort()
  const workflowNames = workflows.map(w => w.short_name)

  const visible = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false
    if (filterPrimary) {
      if (groupBy === 'person'    && t.assignee_name !== filterPrimary) return false
      if (groupBy === 'workflow'  && t.workflow_name !== filterPrimary) return false
    }
    if (filterSecondary) {
      if (groupBy === 'person'   && t.workflow_name  !== filterSecondary) return false
      if (groupBy === 'workflow' && t.assignee_name  !== filterSecondary) return false
    }
    return true
  })

  const groupKeys = groupBy === 'person' ? assigneeNames : workflowNames

  const changeGroup = g => {
    setGroupBy(g); setFilterSecondary(''); setFilterPrimary(''); setOpenTaskId(null)
  }

  const toggleArchiveView = async () => {
    if (!showArchive && archived.length === 0) {
      const data = await authFetch(`/api/tasks?slug=${slug}&archived=1`).then(r => r.json())
      setArchived(data)
    }
    setShowArchive(v => !v)
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
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
    const next = STATUSES[(STATUSES.indexOf(task.status) + 1) % STATUSES.length]
    if (next === 'Done') { await archiveTask(id) }
    else { await updateTask(id, { ...task, status: next }) }
  }

  // ── BULK ──────────────────────────────────────────────────────────────────
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

  if (loading) return <Layout><div style={{ padding: 40, color: '#94A3B8' }}>Loading…</div></Layout>

  return (
    <Layout>
      {/* ── Filter bar ── */}
      <div className="topbar" style={{ marginBottom: 12 }}>
        <div className="toggle" style={{ borderRadius: 8 }}>
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
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className={`btn${showArchive ? ' btn-active' : ''}`} onClick={toggleArchiveView}>
          {showArchive ? '◀ Back' : `Archive (${archived.length})`}
        </button>
        <button className="btn btn-blue" onClick={() => { setAddingNew(true); setOpenTaskId(null) }}>+ Add task</button>
      </div>

      {/* ── Stats row ── */}
      {!showArchive && (
        <>
          <div className="stats-label">Tasks per {groupBy === 'person' ? 'assignee' : 'workflow'}</div>
          <div className="stats">
            {groupKeys.map(key => {
              const count = visible.filter(t => groupBy === 'person' ? t.assignee_name === key : t.workflow_name === key).length
              if (!count) return null
              const { bg, fg } = groupBy === 'person' ? personAv(key) : { bg: workflows.find(w => w.short_name === key)?.bg_color || '#F8FAFC', fg: workflows.find(w => w.short_name === key)?.color || '#64748B' }
              const active = filterPrimary === key
              return (
                <div key={key} className="stat-card"
                  style={{ background: bg, borderColor: active ? fg : fg + '30' }}
                  onClick={() => setFilterPrimary(filterPrimary === key ? '' : key)}>
                  <div className="stat-n" style={{ color: fg }}>{count}</div>
                  <div className="stat-l" style={{ color: fg }}>{key}</div>
                </div>
              )
            })}
            <div className="stat-card">
              <div className="stat-n">{visible.length}</div>
              <div className="stat-l" style={{ color: '#94A3B8' }}>Total</div>
            </div>
          </div>
        </>
      )}

      {/* ── Archive view ── */}
      {showArchive && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#6B7280' }}>Archived ({archived.length})</div>
          {archived.length === 0 && <div className="empty">No archived tasks.</div>}
          {archived.map(t => {
            const { bg, fg } = personAv(t.assignee_name)
            return (
              <div key={t.id} className="arch-row">
                <Avatar name={t.assignee_name} bg={bg} fg={fg} size={20} />
                <span style={{ fontSize: 11, color: '#6B7280', minWidth: 80 }}>{t.assignee_name}</span>
                <span style={{ fontSize: 11, flex: 1, color: '#6B7280' }}>{t.title}</span>
                <StatusPill status={t.status} />
                {t.workflow_color && <CategoryPill name={t.workflow_name} color={t.workflow_color} />}
                <button className="btn" style={{ height: 24, fontSize: 10 }} onClick={() => restoreTask(t.id)}>Restore</button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add form ── */}
      {addingNew && !showArchive && (
        <div style={{ marginBottom: 12 }}>
          <TaskEditForm
            task={null}
            people={people}
            workflows={workflows}
            onSave={createTask}
            onCancel={() => setAddingNew(false)}
            onArchive={() => {}}
          />
        </div>
      )}

      {/* ── Bulk bar ── */}
      {bulkSelected.size > 0 && (
        <div className="bulk-bar">
          <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{bulkSelected.size} task{bulkSelected.size > 1 ? 's' : ''} selected</span>
          <select className="bulk-sel" onChange={e => { applyBulk('status', e.target.value); e.target.value = '' }} defaultValue="">
            <option value="">Change status…</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="bulk-sel" onChange={e => { applyBulk('priority', e.target.value); e.target.value = '' }} defaultValue="">
            <option value="">Change priority…</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="bulk-sel" onChange={e => { applyBulk('assignee_name', e.target.value); e.target.value = '' }} defaultValue="">
            <option value="">Reassign to…</option>
            {assigneeNames.map(n => <option key={n}>{n}</option>)}
          </select>
          <button className="bulk-btn" style={{ background: '#EF4444', color: '#fff' }} onClick={bulkArchive}>Archive</button>
          <button className="bulk-btn" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} onClick={() => setBulkSelected(new Set())}>✕ Clear</button>
        </div>
      )}

      {/* ── Task groups ── */}
      {!showArchive && (
        <>
          {visible.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button className="btn" style={{ height: 26, fontSize: 11 }} onClick={toggleAllGroups}>
                {groupKeys.every(k => collapsed[k]) ? '⊞ Expand all' : '⊟ Collapse all'}
              </button>
            </div>
          )}
          {groupKeys.map(key => {
            const gTasks = visible.filter(t => groupBy === 'person' ? t.assignee_name === key : t.workflow_name === key)
            if (!gTasks.length) return null
            const wf = groupBy === 'workflow' ? workflows.find(w => w.short_name === key) : null
            const { bg, fg } = groupBy === 'person' ? personAv(key) : { bg: wf?.bg_color || '#F8FAFC', fg: wf?.color || '#374151' }
            const ip = gTasks.filter(t => t.status === 'In Progress').length
            const dn = gTasks.filter(t => t.status === 'Done').length
            const ns = gTasks.filter(t => t.status === 'Not Started').length
            const isCollapsed = collapsed[key]

            return (
              <div key={key} className="group" style={{ borderColor: fg + '50' }}>
                <button className="group-hdr" style={{ background: bg }}
                  onClick={() => setCollapsed(c => ({ ...c, [key]: !c[key] }))}>
                  {groupBy === 'person'
                    ? <Avatar name={key} bg={bg} fg={fg} size={26} />
                    : <span style={{ width: 8, height: 8, borderRadius: '50%', background: fg, flexShrink: 0, display: 'inline-block' }} />
                  }
                  <span className="group-name" style={{ color: groupBy === 'person' ? '#0F172A' : fg }}>{key}</span>
                  <span className="group-count">{gTasks.length} tasks</span>
                  {ip > 0 && <span className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{ip} active</span>}
                  {dn > 0 && <span className="badge" style={{ background: '#F0FDF4', color: '#16A34A' }}>{dn} done</span>}
                  {ns > 0 && <span className="badge" style={{ background: '#F1F5F9', color: '#64748B' }}>{ns} pending</span>}
                  <span style={{ fontSize: 10, color: '#CBD5E1', marginLeft: 4 }}>{isCollapsed ? '▶' : '▼'}</span>
                </button>

                {!isCollapsed && gTasks.map(t => {
                  const isOpen = openTaskId === t.id
                  const isChecked = bulkSelected.has(t.id)
                  const { bg: avBg, fg: avFg } = personAv(t.assignee_name)

                  return (
                    <div key={t.id}>
                      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #E5E7EB', background: isChecked ? '#EFF6FF' : 'transparent' }}>
                        <label style={{ display: 'flex', alignItems: 'center', padding: '0 6px 0 12px', cursor: 'pointer', flexShrink: 0 }}
                          onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isChecked}
                            onChange={e => toggleBulk(t.id, e.target.checked)}
                            style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#1D4ED8' }} />
                        </label>
                        <button
                          className={`task-row${isOpen ? ' open' : ''}`}
                          style={{ opacity: t.status === 'Done' ? 0.45 : 1, flex: 1, border: 'none', borderBottom: 'none', padding: '10px 10px 10px 4px' }}
                          onClick={() => setOpenTaskId(isOpen ? null : t.id)}>
                          <span className="dot-status"
                            style={{ background: STATUS_DOT[t.status] || '#CBD5E1' }}
                            onClick={e => { e.stopPropagation(); cycleStatus(t.id) }}
                            title="Click to cycle status" />
                          <span className="task-text">{t.title}</span>
                          <span className="task-date">{fmtDate(t.due_date)}</span>
                          <StatusPill status={t.status} />
                          {groupBy === 'person'
                            ? t.workflow_color && <CategoryPill name={t.workflow_name} color={t.workflow_color} />
                            : <><Avatar name={t.assignee_name} bg={avBg} fg={avFg} size={20} />
                               <span style={{ fontSize: 11, color: '#64748B', minWidth: 80, textAlign: 'left' }}>{t.assignee_name}</span></>
                          }
                          <PriorityPill priority={t.priority} />
                          <span style={{ fontSize: 10, color: '#CBD5E1' }}>{isOpen ? '▲' : '▼'}</span>
                        </button>
                      </div>
                      {isOpen && (
                        <TaskEditForm
                          task={t}
                          people={people}
                          workflows={workflows}
                          onSave={data => updateTask(t.id, { ...t, ...data })}
                          onCancel={() => setOpenTaskId(null)}
                          onArchive={archiveTask}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
          {visible.length === 0 && !addingNew && (
            <div className="empty">No tasks match current filters.</div>
          )}
        </>
      )}
    </Layout>
  )
}
