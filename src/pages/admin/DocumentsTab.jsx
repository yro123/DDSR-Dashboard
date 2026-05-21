import { useState, useEffect } from 'react'
import { useConfig } from '../../context/ConfigContext'

const inputStyle = {
  border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px',
  fontSize: 13, fontFamily: 'inherit', color: 'var(--text)', background: 'var(--surface)',
}
const labelStyle = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-dim)',
  textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4,
}
const btnPrimary = {
  background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 7,
  padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}
const btnCancel = {
  background: 'var(--surface-2)', color: 'var(--text-muted)', border: 'none', borderRadius: 7,
  padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

export default function DocumentsTab({ projectSlug, authFetch }) {
  const { getOptions } = useConfig()
  const docTypes = getOptions('doc_type')
  const [docs, setDocs] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUrl, setEditingUrl] = useState(null)
  const [urlVal, setUrlVal] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newDoc, setNewDoc] = useState({ name: '', url: '', doc_type: 'Process Doc', workflow_id: '' })
  const [saving, setSaving] = useState(false)

  function reload() {
    Promise.all([
      authFetch(`/api/documents?slug=${projectSlug}`).then(r => r.json()),
      authFetch(`/api/workflows?slug=${projectSlug}`).then(r => r.json()),
    ]).then(([d, w]) => {
      setDocs(Array.isArray(d) ? d : [])
      setWorkflows(Array.isArray(w) ? w : [])
      setLoading(false)
    })
  }

  useEffect(() => { setLoading(true); reload() }, [projectSlug])

  async function saveUrl(id) {
    setSaving(true)
    const doc = docs.find(d => d.id === id)
    await authFetch(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...doc, url: urlVal.trim() || null }),
    })
    setSaving(false); setEditingUrl(null); reload()
  }

  async function addDoc() {
    if (!newDoc.name.trim()) return
    setSaving(true)
    await authFetch('/api/documents', {
      method: 'POST',
      body: JSON.stringify({ ...newDoc, slug: projectSlug, workflow_id: newDoc.workflow_id || null }),
    })
    setNewDoc({ name: '', url: '', doc_type: 'Process Doc', workflow_id: '' })
    setShowAdd(false); setSaving(false); reload()
  }

  async function deleteDoc(id) {
    if (!confirm('Remove this document?')) return
    await authFetch(`/api/documents/${id}`, { method: 'DELETE' }); reload()
  }

  if (loading) return <div style={{ color: 'var(--text-dim)', padding: 20 }}>Loading…</div>

  const byWorkflow = workflows.map(w => ({
    ...w,
    docs: docs.filter(d => d.workflow_id === w.id),
  })).filter(w => w.docs.length > 0)
  const unassigned = docs.filter(d => !d.workflow_id)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Documents</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={btnPrimary}>+ Add Document</button>
      </div>

      {showAdd && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Document Name *</label>
              <input value={newDoc.name} onChange={e => setNewDoc(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>URL</label>
              <input value={newDoc.url} onChange={e => setNewDoc(p => ({ ...p, url: e.target.value }))} placeholder="https://…" style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={newDoc.doc_type} onChange={e => setNewDoc(p => ({ ...p, doc_type: e.target.value }))} style={{ ...inputStyle, width: '100%' }}>
                {docTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Workflow</label>
              <select value={newDoc.workflow_id} onChange={e => setNewDoc(p => ({ ...p, workflow_id: e.target.value }))} style={{ ...inputStyle, width: '100%' }}>
                <option value="">— None —</option>
                {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addDoc} style={btnPrimary}>{saving ? 'Saving…' : 'Add Document'}</button>
            <button onClick={() => setShowAdd(false)} style={btnCancel}>Cancel</button>
          </div>
        </div>
      )}

      {[...byWorkflow, ...(unassigned.length ? [{ name: 'Unassigned', docs: unassigned }] : [])].map(group => (
        <div key={group.name} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            {group.name}
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {group.docs.map((doc, i) => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < group.docs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{doc.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{doc.doc_type || '—'}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingUrl === doc.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={urlVal} onChange={e => setUrlVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveUrl(doc.id)}
                        placeholder="https://…" autoFocus style={{ ...inputStyle, flex: 1, padding: '5px 8px', fontSize: 12 }} />
                      <button onClick={() => saveUrl(doc.id)} style={{ ...btnPrimary, padding: '4px 10px', fontSize: 12 }}>{saving ? '…' : 'Save'}</button>
                      <button onClick={() => setEditingUrl(null)} style={{ ...btnCancel, padding: '4px 8px', fontSize: 12 }}>×</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingUrl(doc.id); setUrlVal(doc.url || '') }} style={{
                      background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 10px',
                      fontSize: 12, cursor: 'pointer', color: doc.url ? 'var(--accent)' : 'var(--text-dim)',
                      fontFamily: 'inherit', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'block',
                    }}>
                      {doc.url ? doc.url.replace(/^https?:\/\//, '').slice(0, 40) + (doc.url.length > 47 ? '…' : '') : 'Click to add URL'}
                    </button>
                  )}
                </div>
                <button onClick={() => deleteDoc(doc.id)} style={{
                  border: 'none', background: 'var(--pri-high-bg)', color: 'var(--red)', borderRadius: 6,
                  padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {docs.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40, fontSize: 14 }}>
          No documents yet. Click "+ Add Document" to add one.
        </div>
      )}
    </div>
  )
}
