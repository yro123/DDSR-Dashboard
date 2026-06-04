import { useState, useEffect } from 'react'
import { useProject } from '../../context/ProjectContext'
import { showToast } from '../../components/Toast'

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const inputStyle = {
  border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px',
  fontSize: 13, fontFamily: 'inherit', color: 'var(--text)',
  background: 'var(--surface)', width: '100%',
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

export default function ClientsTab() {
  const { api } = useProject()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [openClientId, setOpenClientId] = useState(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', display_name: '', slug: '', email_domain: '' })
  const [addingProjectFor, setAddingProjectFor] = useState(null)
  const [newProject, setNewProject] = useState({ name: '', subtitle: '', slug: '', go_live_date: '' })
  const [editingClient, setEditingClient] = useState(null)
  const [saving, setSaving] = useState(false)

  function reload() {
    api.get('/api/clients')
      .then(data => { setClients(Array.isArray(data) ? data : []); setLoading(false) })
  }

  useEffect(() => { reload() }, [])

  async function createClient() {
    if (!newClient.name || !newClient.slug) return
    setSaving(true)
    try {
      await api.post('/api/clients', newClient)
      setNewClient({ name: '', display_name: '', slug: '', email_domain: '' })
      setShowNewClient(false); reload()
    } catch (err) {
      showToast(err.message || 'Failed to create client', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function saveClientEdit() {
    setSaving(true)
    try {
      await api.put(`/api/clients/${editingClient.id}`, editingClient)
      setEditingClient(null); reload()
    } catch (err) {
      showToast(err.message || 'Failed to save client', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function setClientActive(client, is_active) {
    if (!is_active && !confirm(`Deactivate ${client.name}? It will be hidden from the dashboard until reactivated.`)) return
    setSaving(true)
    try {
      await api.put(`/api/clients/${client.id}`, { ...client, is_active })
      setEditingClient(null); reload()
    } catch (err) {
      showToast(err.message || 'Failed to update client', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function createProject(clientId) {
    if (!newProject.name || !newProject.slug) return
    setSaving(true)
    try {
      await api.post('/api/projects', { ...newProject, client_id: clientId })
      setNewProject({ name: '', subtitle: '', slug: '', go_live_date: '' })
      setAddingProjectFor(null); reload()
    } catch (err) {
      showToast(err.message || 'Failed to create project', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: 'var(--text-dim)', padding: 20 }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Clients</h2>
        <button onClick={() => setShowNewClient(!showNewClient)} style={btnPrimary}>+ Add Client</button>
      </div>

      {showNewClient && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
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
            <div>
              <label style={labelStyle}>Email Domain</label>
              <input value={newClient.email_domain} onChange={e => setNewClient(p => ({ ...p, email_domain: e.target.value }))} placeholder="acmecorp.com" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createClient} style={btnPrimary}>{saving ? 'Saving…' : 'Create Client'}</button>
            <button onClick={() => setShowNewClient(false)} style={btnCancel}>Cancel</button>
          </div>
        </div>
      )}

      {clients.map(client => {
        const isOpen = openClientId === client.id
        return (
          <div key={client.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 12, overflow: 'hidden', opacity: client.is_active ? 1 : 0.6 }}>
            {editingClient?.id === client.id ? (
              <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label style={labelStyle}>Internal Name</label><input value={editingClient.name} onChange={e => setEditingClient(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Display Name</label><input value={editingClient.display_name} onChange={e => setEditingClient(p => ({ ...p, display_name: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Slug (caution)</label><input value={editingClient.slug} onChange={e => setEditingClient(p => ({ ...p, slug: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Email Domain</label><input value={editingClient.email_domain || ''} onChange={e => setEditingClient(p => ({ ...p, email_domain: e.target.value }))} placeholder="acmecorp.com" style={inputStyle} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={saveClientEdit} style={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
                  <button onClick={() => setEditingClient(null)} style={btnCancel}>Cancel</button>
                  <div style={{ flex: 1 }} />
                  {editingClient.is_active ? (
                    <button onClick={() => setClientActive(editingClient, 0)} style={{
                      background: 'none', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 7,
                      padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>Deactivate</button>
                  ) : (
                    <button onClick={() => setClientActive(editingClient, 1)} style={{
                      background: 'none', color: '#16a34a', border: '1px solid #16a34a', borderRadius: 7,
                      padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>Reactivate</button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                <button onClick={() => setOpenClientId(isOpen ? null : client.id)} style={{ flex: 1, textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{client.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                    slug: {client.slug} · {(client.projects || []).length} project(s)
                    {client.email_domain && <span style={{ marginLeft: 8, color: '#6366f1' }}>@{client.email_domain}</span>}
                  </div>
                </button>
                {!client.is_active && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#dc2626', background: 'rgba(220,38,38,.1)',
                    border: '1px solid rgba(220,38,38,.3)', borderRadius: 5, padding: '2px 7px',
                    textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0,
                  }}>Inactive</span>
                )}
                <button onClick={() => setEditingClient({ ...client })} style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)',
                  border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit',
                }}>Edit</button>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            )}

            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Projects</div>
                {(client.projects || []).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 6, gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>/{p.slug}</span>
                    </div>
                    <a href={`/${p.slug}/tasks`} style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Open →</a>
                  </div>
                ))}

                {addingProjectFor === client.id ? (
                  <div style={{ border: '1px dashed var(--border-mid)', borderRadius: 10, padding: 14, marginTop: 8 }}>
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
                      <button onClick={() => createProject(client.id)} style={btnPrimary}>{saving ? 'Creating…' : 'Create Project'}</button>
                      <button onClick={() => { setAddingProjectFor(null); setNewProject({ name: '', subtitle: '', slug: '', go_live_date: '' }) }} style={btnCancel}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingProjectFor(client.id)} style={{
                    width: '100%', border: '1px dashed var(--border-mid)', borderRadius: 8, padding: 8,
                    fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer', background: 'none', fontFamily: 'inherit', marginTop: 4,
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
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40, fontSize: 14 }}>
          No clients yet. Click "+ Add Client" to create one.
        </div>
      )}
    </div>
  )
}
