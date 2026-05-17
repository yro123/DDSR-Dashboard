import { useState, useEffect } from 'react'

export default function ProjectTab({ projectSlug, authFetch }) {
  const [form, setForm] = useState({ name: '', subtitle: '', go_live_date: '', project_start_date: '', project_end_date: '', slug: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/projects/${projectSlug}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          name: data.name || '',
          subtitle: data.subtitle || '',
          go_live_date: data.go_live_date || '',
          project_start_date: data.project_start_date || '',
          project_end_date: data.project_end_date || '',
          slug: data.slug || '',
        })
        setLoading(false)
      })
  }, [projectSlug])

  async function save() {
    setSaving(true)
    await authFetch(`/api/projects/${projectSlug}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputStyle = {
    border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px',
    fontSize: 14, fontFamily: 'inherit', color: '#0F172A', width: '100%',
  }
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 5 }

  if (loading) return <div style={{ color: '#94A3B8', padding: 20 }}>Loading…</div>

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Project Settings</h2>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 28, maxWidth: 600 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Project Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Slug (read-only)</label>
            <input value={form.slug} disabled style={{ ...inputStyle, background: '#F8FAFC', color: '#94A3B8', cursor: 'not-allowed' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Subtitle</label>
            <input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Project implementation dashboard" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Go-Live Date</label>
            <input type="date" value={form.go_live_date} onChange={e => setForm(p => ({ ...p, go_live_date: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Project Start Date</label>
            <input type="date" value={form.project_start_date} onChange={e => setForm(p => ({ ...p, project_start_date: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Project End Date</label>
            <input type="date" value={form.project_end_date} onChange={e => setForm(p => ({ ...p, project_end_date: e.target.value }))} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={save} style={{
            background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>Saved!</span>}
        </div>
      </div>
    </div>
  )
}
