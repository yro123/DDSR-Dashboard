import { useState, useEffect } from 'react'
import { useProject } from '../../context/ProjectContext'

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '.05em',
}
const inputStyle = {
  padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text)', fontSize: 13,
  fontFamily: 'inherit', outline: 'none',
}
const btnStyle = {
  padding: '5px 12px', borderRadius: 7, border: 'none',
  fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
}

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
      background: color + '20', color,
      textTransform: 'uppercase', letterSpacing: '.04em',
    }}>{label}</span>
  )
}

function UserRow({ user, allProjects, authFetch, onRefresh, currentUserId }) {
  const [editSlug, setEditSlug] = useState(user.clientSlug || '')
  const [isAdmin, setIsAdmin] = useState(!!user.isAdmin)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [settingPwd, setSettingPwd] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [pwdStatus, setPwdStatus] = useState('idle')
  const isDirty = editSlug !== (user.clientSlug || '') || isAdmin !== !!user.isAdmin

  const save = async () => {
    setSaving(true)
    await authFetch(`/api/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({ clientSlug: editSlug || null, isAdmin }),
    })
    setSaving(false)
    onRefresh()
  }

  const del = async () => {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return
    setDeleting(true)
    await authFetch(`/api/users/${user.id}`, { method: 'DELETE' })
    setDeleting(false)
    onRefresh()
  }

  const savePassword = async () => {
    setPwdStatus('saving')
    const res = await authFetch(`/api/users/${user.id}/set-password`, {
      method: 'POST',
      body: JSON.stringify({ password: newPwd }),
    })
    const data = await res.json()
    if (data.ok) {
      setPwdStatus('ok')
      setNewPwd('')
      setTimeout(() => { setPwdStatus('idle'); setSettingPwd(false) }, 1500)
    } else {
      setPwdStatus(data.error || 'error')
      setTimeout(() => setPwdStatus('idle'), 3000)
    }
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '11px 12px', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
        {user.name || <span style={{ color: 'var(--text-dim)' }}>—</span>}
      </td>
      <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</td>
      <td style={{ padding: '11px 12px' }}>
        <select
          value={editSlug}
          onChange={e => setEditSlug(e.target.value)}
          style={{ ...inputStyle, fontSize: 12 }}
        >
          <option value="">— none —</option>
          {allProjects.map(p => (
            <option key={p.slug} value={p.slug}>{p.name} ({p.slug})</option>
          ))}
        </select>
      </td>
      <td style={{ padding: '11px 12px', textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={isAdmin}
          onChange={e => setIsAdmin(e.target.checked)}
          style={{ cursor: 'pointer', accentColor: '#00D4C8' }}
        />
      </td>
      <td style={{ padding: '11px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isDirty && (
              <button onClick={save} disabled={saving} style={{
                ...btnStyle, background: '#00D4C8', color: '#0A0A0A',
              }}>
                {saving ? '…' : 'Save'}
              </button>
            )}
            <button onClick={() => { setSettingPwd(v => !v); setNewPwd(''); setPwdStatus('idle') }} style={{
              ...btnStyle, background: 'var(--surface-2)', color: 'var(--text-muted)',
              border: '1px solid var(--border-mid)',
            }}>
              {settingPwd ? 'Cancel' : 'Set Password'}
            </button>
            {user.id !== currentUserId && (
              <button onClick={del} disabled={deleting} style={{
                ...btnStyle, background: 'var(--surface-2)', color: '#EF4444', border: '1px solid #EF4444',
              }}>
                {deleting ? '…' : 'Delete'}
              </button>
            )}
          </div>
          {settingPwd && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="password"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newPwd.length >= 8 && savePassword()}
                placeholder="New password (min 8 chars)"
                style={{ ...inputStyle, fontSize: 12, width: 200 }}
              />
              <button
                onClick={savePassword}
                disabled={pwdStatus === 'saving' || newPwd.length < 8}
                style={{
                  ...btnStyle,
                  background: pwdStatus === 'ok' ? '#16A34A' : '#00D4C8',
                  color: pwdStatus === 'ok' ? '#fff' : '#0A0A0A',
                  opacity: newPwd.length < 8 ? 0.5 : 1,
                }}
              >
                {pwdStatus === 'saving' ? '…' : pwdStatus === 'ok' ? '✓ Saved' : 'Save'}
              </button>
              {pwdStatus !== 'idle' && pwdStatus !== 'saving' && pwdStatus !== 'ok' && (
                <span style={{ fontSize: 11, color: '#EF4444' }}>{pwdStatus}</span>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

function InviteSection({ authFetch, allProjects }) {
  const [clientSlug, setClientSlug] = useState(allProjects[0]?.slug || '')
  const [email, setEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [invites, setInvites] = useState([])
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  const loadInvites = () => {
    authFetch('/api/invitations').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setInvites(data)
    }).catch(() => {})
  }

  useEffect(() => { loadInvites() }, [])

  const createInvite = async () => {
    if (!clientSlug) return
    setCreating(true)
    setGeneratedLink('')
    try {
      const res = await authFetch('/api/invitations', {
        method: 'POST',
        body: JSON.stringify({ clientSlug, email: email.trim() || undefined }),
      })
      const data = await res.json()
      if (data.url) {
        setGeneratedLink(data.url)
        setEmail('')
        loadInvites()
      }
    } finally {
      setCreating(false)
    }
  }

  const revokeInvite = async (token) => {
    await authFetch(`/api/invitations/${token}`, { method: 'DELETE' })
    loadInvites()
  }

  const copy = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pending = invites.filter(i => !i.usedAt)
  const used = invites.filter(i => i.usedAt)

  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
        Invite Links
      </div>

      {/* Create form */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 20, marginBottom: 20,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14 }}>
          Generate invite link
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ ...labelStyle, marginBottom: 5 }}>Project</div>
            <select
              value={clientSlug}
              onChange={e => setClientSlug(e.target.value)}
              style={{ ...inputStyle }}
            >
              {allProjects.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ ...labelStyle, marginBottom: 5 }}>Email (optional)</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Prefill invitee email"
              style={{ ...inputStyle, width: 220 }}
            />
          </div>
          <button onClick={createInvite} disabled={creating || !clientSlug} style={{
            ...btnStyle, background: '#00D4C8', color: '#0A0A0A', padding: '7px 16px',
          }}>
            {creating ? '…' : 'Generate Link'}
          </button>
        </div>

        {generatedLink && (
          <div style={{
            marginTop: 16, padding: '10px 14px', background: 'var(--surface-2)',
            borderRadius: 8, border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, wordBreak: 'break-all' }}>
              {generatedLink}
            </span>
            <button onClick={copy} style={{
              ...btnStyle, background: copied ? '#16A34A20' : 'var(--surface)',
              color: copied ? '#16A34A' : 'var(--text-muted)',
              border: '1px solid var(--border)', flexShrink: 0,
            }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Pending invites */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...labelStyle, marginBottom: 10 }}>Pending ({pending.length})</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {pending.map(inv => (
              <div key={inv.token} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderBottom: '1px solid var(--border)',
              }}>
                <Badge label={inv.clientSlug} color="#00D4C8" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
                  {inv.email || 'Any email'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  Expires {new Date(inv.expiresAt).toLocaleDateString()}
                </span>
                <button onClick={() => revokeInvite(inv.token)} style={{
                  ...btnStyle, background: 'none', color: '#EF4444', padding: '3px 8px',
                }}>
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Used invites */}
      {used.length > 0 && (
        <div>
          <div style={{ ...labelStyle, marginBottom: 10 }}>Used ({used.length})</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {used.map(inv => (
              <div key={inv.token} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderBottom: '1px solid var(--border)',
                opacity: 0.6,
              }}>
                <Badge label={inv.clientSlug} color="#94A3B8" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
                  {inv.email || 'Any email'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  Used {new Date(inv.usedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function UsersTab({ authFetch }) {
  const { allProjects, session } = useProject()
  const currentUserId = session?.user?.id
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadUsers = () => {
    setLoading(true)
    authFetch('/api/users').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setUsers(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  const filtered = users.filter(u =>
    !search || u.email.includes(search) || (u.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>
        Users ({users.length})
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{ ...inputStyle, width: 280 }}
        />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ ...labelStyle, padding: '9px 12px', textAlign: 'left', fontWeight: 700 }}>Name</th>
              <th style={{ ...labelStyle, padding: '9px 12px', textAlign: 'left', fontWeight: 700 }}>Email</th>
              <th style={{ ...labelStyle, padding: '9px 12px', textAlign: 'left', fontWeight: 700 }}>Project</th>
              <th style={{ ...labelStyle, padding: '9px 12px', textAlign: 'center', fontWeight: 700 }}>Admin</th>
              <th style={{ ...labelStyle, padding: '9px 12px', textAlign: 'left', fontWeight: 700 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No users found</td></tr>
            ) : filtered.map(u => (
              <UserRow
                key={u.id}
                user={u}
                allProjects={allProjects}
                authFetch={authFetch}
                onRefresh={loadUsers}
                currentUserId={currentUserId}
              />
            ))}
          </tbody>
        </table>
      </div>

      <InviteSection authFetch={authFetch} allProjects={allProjects} />
    </div>
  )
}
