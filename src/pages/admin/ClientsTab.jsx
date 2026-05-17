import { useState, useEffect } from 'react'

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ClientsTab({ authFetch }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [openClientId, setOpenClientId] = useState(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', display_name: '', slug: '' })
  const [addingProjectFor, setAddingProjectFor] = useState(null)
  const [newProject, setNewProject] = useState({ name: '', subtitle: '', slug: '', go_live_date: '' })
  const [editingClient, setEditingClient] = useState(null)
  const [saving, setSaving] = useState(false)

  function reload() {
    authFetch('/api/clients')
      .then(r => r.json())
      .then(data => { setClients(Array.isArray(data) ? data : []); setLoading(false) })
  }

  useEffect(() => { reload() }, [])

  async function createClient() {
    if (!newClient.name || !newClient.slug) return
    setSaving(true)
    const res = await authFetch('/api/clients', { method: 'POST', body: JSON.stringify(newClient) })
    setSaving(false)
    if (res.ok) {
      setNewClient({ name: '', display_name: '', slug: '' })
      setShowNewClient(false)
      reload()
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to create client')
    }
  }

  async function saveClientEdit() {
    setSaving(true)
    await authFetch(`/api/clients/${editingClient.id}`, { method: 'PUT', body: JSON.stringify(editingClient) })
    setSaving(false)
    setEditingClient(null)
    reload()
  }

  async function toggleClientActive(client) {
    await authFetch(`/api/clients/${client.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...client, is_active: client.is_active ? 0 : 1 }),
    })
    reload()
  }

  async function createProject(clientId) {
    if (!newProject.name || !newProject.slug) return
    setSaving(true)
    const res = await authFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ ...newProject, client_id: clientId }),
    })
    setSaving(false)
    if (res.ok) {
      setNewProject({ name: '', subtitle: '', slug: '', go_live_date: '' })
      setAddingProjectFor(null)
      reload()
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to create project')
    }
  }

  const inputStyle = {
    border: '1px solid #E2E8F0', borderRadius: 7, padding: '7px 10px',
    fontSize: 13, fontFamily: 'inherit', color: '#0F172A', width: '100%',
  }
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4 }

  if (loading) return <div style={{ color: '#94A3B8', padding: 20 }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Clients</h2>
        <button onClick={() => setShowNewClient(!showNewClient)} style={{
          background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 7,
          padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>+ Add Client</button>
      </div>

      {showNewClient && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Internal Name *</label>
              <input value={newClient.name} onChange={e => {
                const name = e.target.value
                setNewClient(p => ({ ...p, name, slug: slugify(name), display_name: p.display_name || name }))
              }} placeholder="Acme Corp" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Display Name *</label>
              <input value={newClient.display_name} onChange={e => setNewClient(p => ({ ...p, display_name: e.target.value }))} placeholder="Acme" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input value={newClient.slug} onChange={e => setNewClient(p => ({ ...p, slug: e.target.value }))} placeholder="acme" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createClient} style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Create Client'}
            </button>
            <button onClick={() => setShowNewClient(false)} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {clients.map(client => {
        const isOpen = openClientId === client.id
        return (
          <div key={client.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 12, overflow: 'hidden', opacity: client.is_active ? 1 : 0.6 }}>
            {editingClient?.id === client.id ? (
              <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label style={labelStyle}>Internal Name</label><input value={editingClient.name} onChange={e => setEditingClient(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Display Name</label><input value={editingClient.display_name} onChange={e => setEditingClient(p => ({ ...p, display_name: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Slug (caution)</label><input value={editingClient.slug} onChange={e => setEditingClient(p => ({ ...p, slug: e.target.value }))} style={inputStyle} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveClientEdit} style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Save'}</button>
                  <button onClick={() => setEditingClient(null)} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                <button onClick={() => setOpenClientId(isOpen ? null : client.id)} style={{ flex: 1, textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{client.name}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    slug: {client.slug} · {(client.projects || []).length} project(s)
                  </div>
                </button>
                <button onClick={() => toggleClientActive(client)} style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: client.is_active ? '#1D4ED8' : '#CBD5E1', position: 'relative', padding: 0, flexShrink: 0,
                }}>
                  <span style={{ position: 'absolute', top: 2, left: client.is_active ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
                </button>
                <button onClick={() => setEditingClient({ ...client })} style={{ fontSize: 11, fontWeight: 600, color: '#64748B', background: '#F1F5F9', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            )}

            {isOpen && (
              <div style={{ borderTop: '1px solid #F1F5F9', padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Projects</div>
                {(client.projects || []).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, marginBottom: 6, gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>/{p.slug}</span>
                    </div>
                    <a href={`/${p.slug}/tasks`} style={{ fontSize: 11, color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>Open →</a>
                  </div>
                ))}

                {addingProjectFor === client.id ? (
                  <div style={{ border: '1px dashed #CBD5E1', borderRadius: 10, padding: 14, marginTop: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={labelStyle}>Project Name *</label>
                        <input value={newProject.name} onChange={e => {
                          const name = e.target.value
                          setNewProject(p => ({ ...p, name, slug: slugify(name) }))
                        }} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Slug *</label>
                        <input value={newProject.slug} onChange={e => setNewProject(p => ({ ...p, slug: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Subtitle</label>
                        <input value={newProject.subtitle} onChange={e => setNewProject(p => ({ ...p, subtitle: e.target.value }))} placeholder="Project implementation dashboard" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Go-Live Date</label>
                        <input type="date" value={newProject.go_live_date} onChange={e => setNewProject(p => ({ ...p, go_live_date: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => createProject(client.id)} style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {saving ? 'Creating…' : 'Create Project'}
                      </button>
                      <button onClick={() => { setAddingProjectFor(null); setNewProject({ name: '', subtitle: '', slug: '', go_live_date: '' }) }} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingProjectFor(client.id)} style={{
                    width: '100%', border: '1px dashed #CBD5E1', borderRadius: 8, padding: 8,
                    fontSize: 12, color: '#94A3B8', cursor: 'pointer', background: 'none', fontFamily: 'inherit', marginTop: 4,
                  }}>
                    + Add Project
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {clients.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: 40, fontSize: 14 }}>
          No clients yet. Click "+ Add Client" to create one.
        </div>
      )}
    </div>
  )
}
