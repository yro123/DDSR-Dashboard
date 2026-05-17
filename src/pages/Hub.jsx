import { useState, useEffect } from 'react'
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

export default function Hub() {
  const { slug, authFetch, isAdmin } = useProject()
  const { dark } = useTheme()
  const [workflows, setWorkflows] = useState([])
  const [tasks, setTasks]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [openWf, setOpenWf]       = useState(null)
  const [openStep, setOpenStep]   = useState(null)
  const [docOpen, setDocOpen]     = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      authFetch(`/api/workflows?slug=${slug}`).then(r => r.json()),
      authFetch(`/api/tasks?slug=${slug}`).then(r => r.json()),
    ]).then(([w, t]) => { setWorkflows(w); setTasks(t); setLoading(false) })
  }, [slug, authFetch])

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
      .then(r => { if (!r.ok) authFetch(`/api/workflows?slug=${slug}`).then(r2 => r2.json()).then(setWorkflows) })
  }

  if (loading) return <Layout><div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div></Layout>

  const allDocs = workflows.flatMap(w => (w.docs || []).map(d => ({ ...d, workflowName: w.name })))

  return (
    <Layout>
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
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>{w.description}</p>

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
                  {steps.map(s => {
                    const isStepOpen = openStep === s.id
                    return (
                      <div key={s.id}>
                        <div className="step-row" onClick={() => setOpenStep(isStepOpen ? null : s.id)}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_DOT[s.status] || 'var(--border-mid)', flexShrink: 0, display: 'inline-block' }} />
                          <span className="step-label">{s.label}</span>
                          <span
                            onClick={isAdmin ? e => cycleStepStatus(e, w.id, s.id, s.status) : undefined}
                            title={isAdmin ? 'Click to cycle status' : undefined}
                            style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                              background: s.status === 'Done' ? 'var(--status-done-bg)' : s.status === 'In Progress' ? 'var(--status-ip-bg)' : 'var(--status-ns-bg)',
                              color: s.status === 'Done' ? 'var(--status-done-col)' : s.status === 'In Progress' ? 'var(--status-ip-col)' : 'var(--status-ns-col)',
                              cursor: isAdmin ? 'pointer' : 'default',
                            }}>{s.status}</span>
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
                      </div>
                    )
                  })}

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
    </Layout>
  )
}
