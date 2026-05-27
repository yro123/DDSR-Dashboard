import { useState, useEffect } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import { STATUS_DOT } from '../data/constants'
import { useProject } from '../context/ProjectContext'
import { useTheme } from '../context/ThemeContext'

const ACCENT = {
  '#F59E0B': '#B45309', '#22C55E': '#16793A', '#3B82F6': '#1D4ED8',
  '#A855F7': '#7C3AED', '#14B8A6': '#0D9488', '#64748B': '#475569',
}
const GRAD_LIGHT = {
  '#F59E0B': '#FEF9EC', '#22C55E': '#F0FBF4', '#3B82F6': '#EFF4FE',
  '#A855F7': '#F8F3FE', '#14B8A6': '#F0FBFA', '#64748B': '#F4F6F8',
}
const GRAD_DARK = {
  '#F59E0B': '#1C1200', '#22C55E': '#051C10', '#3B82F6': '#020C1E',
  '#A855F7': '#110B1E', '#14B8A6': '#061514', '#64748B': '#0E1015',
}

const btnEdit = {
  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
  border: '1px solid var(--border)', background: 'var(--surface-2)',
  color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
}
const btnSave = {
  fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
  border: 'none', background: 'var(--accent)', color: 'var(--accent-text)',
  cursor: 'pointer', fontFamily: 'inherit',
}
const btnCancel = {
  fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
}
const inputStyle = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 7,
  padding: '6px 10px', fontSize: 12, fontFamily: 'inherit',
  color: 'var(--text)', background: 'var(--surface)', resize: 'vertical',
}
const labelStyle = {
  fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
  textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4,
}

// ── Step drag-to-reorder ──────────────────────────────────────────────────────

function SortableStep({ s, isAdmin, openStep, setOpenStep, editingStepId, setEditingStepId, editForm, setEditForm, saveStep, cycleStepStatus, wfId }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: s.id })
  const isStepOpen = openStep === s.id

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      {editingStepId === s.id ? (
        <div style={{ padding: '12px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Label</label>
            <input value={editForm.label || ''} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
              style={{ ...inputStyle, resize: 'none' }} autoFocus />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Summary</label>
            <textarea value={editForm.summary || ''} onChange={e => setEditForm(f => ({ ...f, summary: e.target.value }))}
              rows={3} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Bullet points (one per line)</label>
            <textarea value={editForm.points || ''} onChange={e => setEditForm(f => ({ ...f, points: e.target.value }))}
              rows={4} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => saveStep(s.id)} style={btnSave}>Save</button>
            <button onClick={() => setEditingStepId(null)} style={btnCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="step-row" onClick={() => setOpenStep(isStepOpen ? null : s.id)}>
            {isAdmin && (
              <span {...attributes} {...listeners} onClick={e => e.stopPropagation()}
                title="Drag to reorder"
                style={{ cursor: 'grab', color: 'var(--text-dim)', fontSize: 13, lineHeight: 1, flexShrink: 0, marginRight: 2 }}>⠿</span>
            )}
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_DOT[s.status] || 'var(--border-mid)', flexShrink: 0, display: 'inline-block' }} />
            <span className="step-label">{s.label}</span>
            <span
              onClick={isAdmin ? e => cycleStepStatus(e, wfId, s.id, s.status) : undefined}
              title={isAdmin ? 'Click to cycle status' : undefined}
              style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                background: s.status === 'Done' ? 'var(--status-done-bg)' : s.status === 'In Progress' ? 'var(--status-ip-bg)' : 'var(--status-ns-bg)',
                color: s.status === 'Done' ? 'var(--status-done-col)' : s.status === 'In Progress' ? 'var(--status-ip-col)' : 'var(--status-ns-col)',
                cursor: isAdmin ? 'pointer' : 'default',
              }}>{s.status}</span>
            {isAdmin && (
              <button onClick={e => { e.stopPropagation(); setEditingStepId(s.id); setEditForm({ label: s.label, summary: s.summary || '', points: (s.points || []).join('\n') }) }}
                style={btnEdit}>Edit</button>
            )}
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{isStepOpen ? '▲' : '▼'}</span>
          </div>
          {isStepOpen && s.summary && (
            <div style={{ padding: '10px 16px 10px 26px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text)', marginBottom: 8, lineHeight: 1.6 }}>{s.summary}</p>
              {(s.points || []).length > 0 && (
                <ul style={{ paddingLeft: 16 }}>
                  {s.points.map((p, i) => (
                    <li key={i} style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, lineHeight: 1.5 }}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StepList({ wfId, steps, isAdmin, openStep, setOpenStep, editingStepId, setEditingStepId, editForm, setEditForm, saveStep, cycleStepStatus, onDragEnd }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const shared = { isAdmin, openStep, setOpenStep, editingStepId, setEditingStepId, editForm, setEditForm, saveStep, cycleStepStatus, wfId }

  if (!isAdmin) {
    return steps.map(s => <SortableStep key={s.id} s={s} {...shared} />)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {steps.map(s => <SortableStep key={s.id} s={s} {...shared} />)}
      </SortableContext>
    </DndContext>
  )
}

export default function Hub() {
  const { slug, authFetch, isAdmin } = useProject()
  const { dark } = useTheme()
  const [workflows, setWorkflows] = useState([])
  const [tasks, setTasks]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [openWf, setOpenWf]       = useState(null)
  const [openStep, setOpenStep]   = useState(null)
  const [docOpen, setDocOpen]     = useState(false)

  // Edit state
  const [editingWfId, setEditingWfId]     = useState(null)
  const [editingStepId, setEditingStepId] = useState(null)
  const [editForm, setEditForm]           = useState({})

  useEffect(() => {
    setLoading(true)
    Promise.all([
      authFetch(`/api/workflows?slug=${slug}`).then(r => r.json()),
      authFetch(`/api/tasks?slug=${slug}`).then(r => r.json()),
    ]).then(([w, t]) => { setWorkflows(w); setTasks(t); setLoading(false) })
  }, [slug, authFetch])

  const reloadWorkflows = () =>
    authFetch(`/api/workflows?slug=${slug}`).then(r => r.json()).then(setWorkflows)

  const STEP_CYCLE = { 'Not Started': 'In Progress', 'In Progress': 'Done', 'Done': 'Not Started' }

  function cycleStepStatus(e, wfId, stepId, currentStatus) {
    e.stopPropagation()
    if (!isAdmin) return
    const next = STEP_CYCLE[currentStatus] || 'Not Started'
    setWorkflows(prev => prev.map(w => w.id === wfId
      ? { ...w, steps: w.steps.map(s => s.id === stepId ? { ...s, status: next } : s) }
      : w
    ))
    authFetch(`/api/workflow-steps/${stepId}`, { method: 'PUT', body: JSON.stringify({ status: next }) })
      .then(r => { if (!r.ok) reloadWorkflows() })
  }

  async function saveWorkflowDesc(id) {
    await authFetch(`/api/workflows/${id}`, {
      method: 'PUT', body: JSON.stringify({ description: editForm.description }),
    })
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, description: editForm.description } : w))
    setEditingWfId(null)
  }

  async function saveStep(stepId) {
    const points = (editForm.points || '').split('\n').filter(p => p.trim())
    await authFetch(`/api/workflow-steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify({ label: editForm.label, summary: editForm.summary, points }),
    })
    setEditingStepId(null)
    reloadWorkflows()
  }

  function makeStepDragEnd(wfId, steps) {
    return async ({ active, over }) => {
      if (!over || active.id === over.id) return
      const oldIdx = steps.findIndex(s => s.id === active.id)
      const newIdx = steps.findIndex(s => s.id === over.id)
      const reordered = arrayMove(steps, oldIdx, newIdx)
      setWorkflows(prev => prev.map(w => w.id === wfId ? { ...w, steps: reordered } : w))
      const updates = reordered
        .map((s, idx) => ({ s, newOrder: idx }))
        .filter(({ s, newOrder }) => s.sort_order !== newOrder)
      await Promise.all(updates.map(({ s, newOrder }) =>
        authFetch(`/api/workflow-steps/${s.id}`, { method: 'PUT', body: JSON.stringify({ sort_order: newOrder }) })
      ))
      reloadWorkflows()
    }
  }

  if (loading) return <Layout><div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div></Layout>

  const allDocs = workflows.flatMap(w => (w.docs || []).map(d => ({ ...d, workflowName: w.name })))

  return (
    <Layout>
      <div className="tasks-scroll-area" style={{ paddingBottom: 40 }}>
      <div style={{ maxWidth: 900 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
          Click any workflow to expand — cheat sheet notes from project documents
        </p>

        {workflows.map(w => {
          const accent    = ACCENT[w.color] || w.color
          const gradMap   = dark ? GRAD_DARK : GRAD_LIGHT
          const grad      = gradMap[w.color] || (dark ? '#141414' : '#F8FAFC')
          const wTasks    = tasks.filter(t => t.workflow_name === w.short_name)
          const open      = wTasks.filter(t => t.status !== 'Done').length
          const done      = wTasks.filter(t => t.status === 'Done').length
          const ip        = wTasks.filter(t => t.status === 'In Progress').length
          const steps     = w.steps || []
          const stepsDone = steps.filter(s => s.status === 'Done').length
          const pct       = steps.length ? Math.round((stepsDone / steps.length) * 100) : 0
          const isOpen    = openWf === w.id

          return (
            <div key={w.id} className="hub-card" style={{ border: `1px solid ${accent}30` }}>
              {/* Header */}
              <button style={{
                width: '100%', background: grad, border: 'none', cursor: 'pointer',
                padding: '20px 24px', textAlign: 'left', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 16,
                borderBottom: isOpen ? `1px solid ${accent}25` : 'none',
              }} onClick={() => setOpenWf(isOpen ? null : w.id)}>
                <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{w.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: accent, marginBottom: 5 }}>{w.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {open > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: accent + '18', color: accent }}>{open} open</span>}
                    {ip   > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: accent + '18', color: accent }}>{ip} active</span>}
                    {done > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: accent + '18', color: accent }}>{done} done</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{w.phase}</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ width: 80, height: 4, background: accent + '20', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: 4, width: `${pct}%`, background: accent, borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: accent }}>{pct}%</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', flexShrink: 0, marginLeft: 8 }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div style={{ background: 'var(--surface)', padding: 24 }}>

                  {/* Description */}
                  {editingWfId === w.id ? (
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Description</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        rows={4}
                        style={inputStyle}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => saveWorkflowDesc(w.id)} style={btnSave}>Save</button>
                        <button onClick={() => setEditingWfId(null)} style={btnCancel}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16 }}>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 }}>{w.description}</p>
                      {isAdmin && (
                        <button
                          onClick={() => { setEditingWfId(w.id); setEditForm({ description: w.description || '' }) }}
                          style={btnEdit}
                        >Edit</button>
                      )}
                    </div>
                  )}

                  {(w.owners || []).length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Owners</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {w.owners.map((o, i) => (
                          <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: accent + '18', color: accent }}>
                            {o.owner_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Milestones</div>
                  <StepList
                    wfId={w.id}
                    steps={steps}
                    isAdmin={isAdmin}
                    openStep={openStep}
                    setOpenStep={setOpenStep}
                    editingStepId={editingStepId}
                    setEditingStepId={setEditingStepId}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    saveStep={saveStep}
                    cycleStepStatus={cycleStepStatus}
                    onDragEnd={makeStepDragEnd(w.id, steps)}
                  />

                  {(w.docs || []).length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Documents</div>
                      {w.docs.map((d, i) => (
                        <a key={i} className="doc-item" href={d.url || '#'} target="_blank" rel="noreferrer">📄 {d.name}</a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Document library */}
        <div style={{ marginTop: 32, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <button onClick={() => setDocOpen(v => !v)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px', background: 'var(--surface-2)', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontFamily: 'inherit',
          }}>
            <span style={{ fontSize: 18 }}>📁</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Project Documents</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>All source documents</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{docOpen ? '▼' : '▶'}</span>
          </button>
          {docOpen && (
            <div style={{ padding: '16px 18px', background: 'var(--surface)' }}>
              {allDocs.map((d, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <a className="doc-item" href={d.url || '#'} target="_blank" rel="noreferrer">📄 {d.name}</a>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>{d.workflowName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </Layout>
  )
}
