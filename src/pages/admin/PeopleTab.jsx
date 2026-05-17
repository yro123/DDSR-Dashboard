import { useState, useEffect } from 'react'

const PRESET_COLORS = [
  { bg: '#DBEAFE', fg: '#1E40AF' },
  { bg: '#D1FAE5', fg: '#065F46' },
  { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#FCE7F3', fg: '#9D174D' },
  { bg: '#E0E7FF', fg: '#3730A3' },
  { bg: '#CCFBF1', fg: '#0F766E' },
  { bg: '#FFE4E6', fg: '#9F1239' },
  { bg: '#F1F5F9', fg: '#475569' },
]

const ORG_TYPES = ['Partner', 'Client', 'Vendor', 'Internal']

function Avatar({ name, bg, fg, size = 32 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  )
}

export default function PeopleTab({ projectSlug, authFetch, currentProject }) {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', role: '', org_type: 'Client', email: '', avatar_bg: '#DBEAFE', avatar_fg: '#1E40AF' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  function reload() {
    authFetch(`/api/people?slug=${projectSlug}`)
      .then(r => r.json())
      .then(data => setPeople(Array.isArray(data) ? data : []))
  }

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/people?slug=${projectSlug}`)
      .then(r => r.json())
      .then(data => { setPeople(Array.isArray(data) ? data : []); setLoading(false) })
  }, [projectSlug])

  async function addPerson() {
    if (!form.name.trim()) return
    setSaving(true)
    await authFetch('/api/people', {
      method: 'POST',
      body: JSON.stringify({ ...form, slug: projectSlug }),
    })
    setForm({ name: '', role: '', org_type: 'Client', email: '', avatar_bg: '#DBEAFE', avatar_fg: '#1E40AF' })
    setShowAdd(false)
    setSaving(false)
    reload()
  }

  async function savePerson() {
    setSaving(true)
    await authFetch(`/api/people/${editingId}`, { method: 'PUT', body: JSON.stringify(editForm) })
    setSaving(false)
    setEditingId(null)
    reload()
  }

  async function toggleActive(person) {
    await authFetch(`/api/people/${person.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...person, is_active: person.is_active ? 0 : 1 }),
    })
    reload()
  }

  if (loading) return <div style={{ color: '#94A3B8', padding: 20 }}>Loading…</div>

  const colorForm = showAdd ? form : editForm
  const setColorForm = showAdd ? setForm : setEditForm

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Team Members</h2>
        <button onClick={() => setShowAdd(!showAdd)} style={{
          background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 7,
          padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>+ Add Person</button>
      </div>

      {showAdd && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[['Name *', 'name', 'text'], ['Role', 'role', 'text'], ['Email', 'email', 'email']].map(([label, key, type]) => (
              <div key={key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4 }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={{
                  width: '100%', border: '1px solid #E2E8F0', borderRadius: 7, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit',
                }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4 }}>Org Type</label>
              <select value={form.org_type} onChange={e => setForm(p => ({ ...p, org_type: e.target.value }))} style={{
                width: '100%', border: '1px solid #E2E8F0', borderRadius: 7, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit',
              }}>
                {ORG_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 8 }}>Avatar Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {PRESET_COLORS.map((c, i) => (
                <button key={i} onClick={() => setForm(p => ({ ...p, avatar_bg: c.bg, avatar_fg: c.fg }))} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c.bg, border: form.avatar_bg === c.bg ? `2px solid ${c.fg}` : '2px solid transparent',
                  cursor: 'pointer', fontSize: 10, fontWeight: 700, color: c.fg,
                }}>Aa</button>
              ))}
              <Avatar name={form.name || '?'} bg={form.avatar_bg} fg={form.avatar_fg} size={28} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addPerson} style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Add Person'}
            </button>
            <button onClick={() => setShowAdd(false)} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['', 'Name', 'Role', 'Org Type', 'Email', 'Active', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #E2E8F0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', opacity: p.is_active ? 1 : 0.5 }}>
                {editingId === p.id ? (
                  <td colSpan={7} style={{ padding: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                      {[['Name', 'name'], ['Role', 'role'], ['Email', 'email']].map(([label, key]) => (
                        <div key={key}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 3 }}>{label}</label>
                          <input value={editForm[key] || ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} style={{
                            width: '100%', border: '1px solid #E2E8F0', borderRadius: 7, padding: '5px 8px', fontSize: 12, fontFamily: 'inherit',
                          }} />
                        </div>
                      ))}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 3 }}>Org Type</label>
                        <select value={editForm.org_type || ''} onChange={e => setEditForm(p => ({ ...p, org_type: e.target.value }))} style={{
                          width: '100%', border: '1px solid #E2E8F0', borderRadius: 7, padding: '5px 8px', fontSize: 12, fontFamily: 'inherit',
                        }}>
                          {ORG_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>Avatar Color</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {PRESET_COLORS.map((c, i) => (
                          <button key={i} onClick={() => setEditForm(p => ({ ...p, avatar_bg: c.bg, avatar_fg: c.fg }))} style={{
                            width: 28, height: 28, borderRadius: '50%', background: c.bg, border: editForm.avatar_bg === c.bg ? `2px solid ${c.fg}` : '2px solid transparent',
                            cursor: 'pointer', fontSize: 10, fontWeight: 700, color: c.fg,
                          }}>Aa</button>
                        ))}
                        <Avatar name={editForm.name || '?'} bg={editForm.avatar_bg} fg={editForm.avatar_fg} size={28} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={savePerson} style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td style={{ padding: '10px 14px' }}><Avatar name={p.name} bg={p.avatar_bg} fg={p.avatar_fg} size={30} /></td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{p.name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B' }}>{p.role || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B' }}>{p.org_type || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748B' }}>{p.email || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => toggleActive(p)} style={{
                        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: p.is_active ? '#1D4ED8' : '#CBD5E1', position: 'relative', padding: 0,
                      }}>
                        <span style={{
                          position: 'absolute', top: 2, left: p.is_active ? 18 : 2, width: 16, height: 16,
                          borderRadius: '50%', background: '#fff', transition: 'left .15s',
                        }} />
                      </button>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => { setEditingId(p.id); setEditForm({ ...p }) }} style={{
                        fontSize: 11, fontWeight: 600, color: '#64748B', background: '#F1F5F9',
                        border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit',
                      }}>Edit</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
