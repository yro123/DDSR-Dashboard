import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useConfig } from '../../context/ConfigContext'
import { useProject } from '../../context/ProjectContext'
import Modal from '../../components/Modal'
import { showToast } from '../../components/Toast'
import type { PersonRow } from '../../../shared/types'

// A person row as returned by /api/people, enriched with account-link flags.
interface PersonWithAccount extends PersonRow {
  has_account?: boolean
}

// A user as returned by /api/users (subset used here), with client memberships.
interface UserWithMemberships {
  id: string
  name: string
  email: string
  memberships?: { client_slug: string }[]
}

interface InviteResult {
  email: string
  url: string
}

interface PersonForm {
  name: string
  role: string
  org_type: string
  email: string
  avatar_bg: string
  avatar_fg: string
}

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

interface AvatarProps {
  name?: string | null
  bg?: string | null
  fg?: string | null
  size?: number
}
function Avatar({ name, bg, fg, size = 32 }: AvatarProps) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg || undefined, color: fg || undefined,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  )
}

const inputStyle: CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 7,
  padding: '7px 10px', fontSize: 13, fontFamily: 'inherit',
  background: 'var(--surface)', color: 'var(--text)',
}
const labelStyle: CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-dim)',
  textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4,
}
const btnStyle = (variant: 'primary' | 'cancel' = 'primary'): CSSProperties => ({
  border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12,
  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  ...(variant === 'primary'
    ? { background: 'var(--accent)', color: 'var(--accent-text)' }
    : { background: 'var(--surface-2)', color: 'var(--text-muted)' }),
})

interface PeopleTabProps {
  projectSlug?: string
}

export default function PeopleTab({ projectSlug: propProjectSlug }: PeopleTabProps) {
  const { api, currentClient } = useProject()
  const { getOptions } = useConfig()
  const orgTypes = getOptions('org_type')

  // Prefer prop (from Admin client selector), fall back to global currentClient
  const projectSlug = propProjectSlug || currentClient?.slug

  const [people, setPeople] = useState<PersonWithAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<PersonForm>({ name: '', role: '', org_type: 'Client', email: '', avatar_bg: '#DBEAFE', avatar_fg: '#1E40AF' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<PersonWithAccount>>({})
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<UserWithMemberships[]>([])
  const [backfilling, setBackfilling] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Nice invite results modal (replaces ugly alert() spam for bulk/single invites)
  const [inviteResults, setInviteResults] = useState<InviteResult[] | null>(null) // array of {email, url} or null

  function reload() {
    if (!projectSlug) return
    api.get<PersonWithAccount[]>(`/api/people?slug=${projectSlug}`)
      .then(data => setPeople(Array.isArray(data) ? data : []))
  }

  useEffect(() => {
    if (!projectSlug) return
    setLoading(true)
    api.get<PersonWithAccount[]>(`/api/people?slug=${projectSlug}`)
      .then(data => { setPeople(Array.isArray(data) ? data : []); setLoading(false) })
    api.get<UserWithMemberships[]>('/api/users')
      .then(data => {
        if (!Array.isArray(data)) return setUsers([]);

        // In Admin we show users who have explicit membership in the current project via user_clients.
        const relevantUsers = data.filter(u =>
          u.memberships?.some(m => m.client_slug === projectSlug)
        )

        setUsers(relevantUsers);
      })
      .catch(() => {});
  }, [projectSlug])

  async function addPerson() {
    if (!form.name.trim() || !projectSlug) return
    setSaving(true)
    await api.post('/api/people', { ...form, slug: projectSlug })
    setForm({ name: '', role: '', org_type: 'Client', email: '', avatar_bg: '#DBEAFE', avatar_fg: '#1E40AF' })
    setShowAdd(false); setSaving(false); reload()
  }

  async function savePerson() {
    setSaving(true)
    await api.put(`/api/people/${editingId}`, editForm)
    setSaving(false); setEditingId(null); reload()
  }

  async function runBackfill() {
    setBackfilling(true)
    try {
      const data = await api.post<{ linked: number; skipped: number }>('/api/admin/backfill-people-links', {})
      showToast(`Auto-link complete: ${data.linked} linked, ${data.skipped} skipped`, 'success')
      reload()
    } catch {
      showToast('Backfill failed', 'error')
    }
    setBackfilling(false)
  }

  async function inviteSelected() {
    const ids = Array.from(selected)
    if (ids.length === 0) return

    setSaving(true)
    try {
      if (!projectSlug) return
      const data = await api.post<{ invites?: InviteResult[] }>('/api/invitations', { slug: projectSlug, personIds: ids })

      if (data?.invites?.length && data.invites.length > 0) {
        setInviteResults(data.invites) // open nice modal
      } else {
        setInviteResults([]) // success but no links returned
      }

      setSelected(new Set())
      reload()
    } catch (e) {
      showToast('Failed to send invites', 'error')
    }
    setSaving(false)
  }

  async function toggleActive(person: PersonWithAccount) {
    await api.put(`/api/people/${person.id}`, { ...person, is_active: person.is_active ? 0 : 1 })
    reload()
  }

  if (loading) return <div style={{ color: 'var(--text-dim)', padding: 20 }}>Loading…</div>

  interface ColorSelectorProps {
    colorForm: { name?: string; avatar_bg?: string | null; avatar_fg?: string | null }
    setColorForm: (updater: (p: any) => any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  function ColorSelector({ colorForm, setColorForm }: ColorSelectorProps) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Avatar Color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {PRESET_COLORS.map((c, i) => (
            <button key={i} onClick={() => setColorForm(p => ({ ...p, avatar_bg: c.bg, avatar_fg: c.fg }))} style={{
              width: 28, height: 28, borderRadius: '50%', background: c.bg,
              border: colorForm.avatar_bg === c.bg ? `2px solid ${c.fg}` : '2px solid transparent',
              cursor: 'pointer', fontSize: 10, fontWeight: 700, color: c.fg,
            }}>Aa</button>
          ))}
          <Avatar name={colorForm.name || '?'} bg={colorForm.avatar_bg} fg={colorForm.avatar_fg} size={28} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Team Members</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={runBackfill} style={btnStyle('cancel')} title="Match people to users by email address">
            {backfilling ? 'Linking…' : '⚡ Auto-link by email'}
          </button>
          <button onClick={() => setShowAdd(!showAdd)} style={btnStyle()}>+ Add Person</button>
        </div>
      </div>

      {showAdd && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {([['Name *', 'name', 'text'], ['Role', 'role', 'text'], ['Email', 'email', 'email']] as const).map(([label, key, type]) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <div>
              <label style={labelStyle}>Org Type</label>
              <select value={form.org_type} onChange={e => setForm(p => ({ ...p, org_type: e.target.value }))} style={inputStyle}>
                {orgTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <ColorSelector colorForm={form} setColorForm={setForm} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addPerson} style={btnStyle()}>{saving ? 'Saving…' : 'Add Person'}</button>
            <button onClick={() => setShowAdd(false)} style={btnStyle('cancel')}>Cancel</button>
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.size} selected</span>
          <button onClick={inviteSelected} disabled={saving} style={btnStyle()}>
            {saving ? 'Inviting…' : 'Invite Selected'}
          </button>
          <button onClick={() => {
            const invitables = people.filter(p => !p.has_account && p.email && p.is_active).map(p => p.id)
            setSelected(new Set(invitables))
          }} style={btnStyle('cancel')}>Select All</button>
          <button onClick={() => setSelected(new Set())} style={btnStyle('cancel')}>Clear</button>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['', 'Name', 'Role', 'Org Type', 'Email', 'User', 'Active', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.map(p => {
              const canInvite = !p.has_account && p.email && p.is_active
              const isSelected = selected.has(p.id)

              return (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', opacity: p.is_active ? 1 : 0.5 }}>
                {editingId === p.id ? (
                  <td colSpan={8} style={{ padding: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                      {([['Name', 'name'], ['Role', 'role'], ['Email', 'email']] as const).map(([label, key]) => (
                        <div key={key}>
                          <label style={labelStyle}>{label}</label>
                          <input value={(editForm[key] as string) || ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} style={{ ...inputStyle, padding: '5px 8px', fontSize: 12 }} />
                        </div>
                      ))}
                      <div>
                        <label style={labelStyle}>Org Type</label>
                        <select value={editForm.org_type || ''} onChange={e => setEditForm(p => ({ ...p, org_type: e.target.value }))} style={{ ...inputStyle, padding: '5px 8px', fontSize: 12 }}>
                          {orgTypes.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      {users.length > 0 && (
                        <div>
                          <label style={labelStyle}>Linked User</label>
                          <select value={editForm.user_id || ''} onChange={e => setEditForm(p => ({ ...p, user_id: e.target.value || null }))} style={{ ...inputStyle, padding: '5px 8px', fontSize: 12 }}>
                            <option value="">— Not linked —</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={labelStyle}>Avatar Color</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {PRESET_COLORS.map((c, i) => (
                          <button key={i} onClick={() => setEditForm(p => ({ ...p, avatar_bg: c.bg, avatar_fg: c.fg }))} style={{
                            width: 28, height: 28, borderRadius: '50%', background: c.bg,
                            border: editForm.avatar_bg === c.bg ? `2px solid ${c.fg}` : '2px solid transparent',
                            cursor: 'pointer', fontSize: 10, fontWeight: 700, color: c.fg,
                          }}>Aa</button>
                        ))}
                        <Avatar name={editForm.name || '?'} bg={editForm.avatar_bg} fg={editForm.avatar_fg} size={28} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={savePerson} style={btnStyle()}>{saving ? 'Saving…' : 'Save'}</button>
                      <button onClick={() => setEditingId(null)} style={btnStyle('cancel')}>Cancel</button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td style={{ padding: '10px 14px' }}>
                      {canInvite ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const next = new Set(selected)
                            if (next.has(p.id)) next.delete(p.id)
                            else next.add(p.id)
                            setSelected(next)
                          }}
                        />
                      ) : (
                        <Avatar name={p.name} bg={p.avatar_bg} fg={p.avatar_fg} size={30} />
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{p.role || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{p.org_type || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{p.email || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {p.has_account
                        ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#D1FAE5', color: '#065F46' }}>Has account</span>
                        : p.user_id
                          ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: '#FEF3C7', color: '#92400E' }}>Linked</span>
                          : <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => toggleActive(p)} style={{
                        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: p.is_active ? 'var(--accent)' : 'var(--border-mid)', position: 'relative', padding: 0,
                      }}>
                        <span style={{
                          position: 'absolute', top: 2, left: p.is_active ? 18 : 2, width: 16, height: 16,
                          borderRadius: '50%', background: '#fff', transition: 'left .15s',
                        }} />
                      </button>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => { setEditingId(p.id); setEditForm({ ...p }) }} style={{
                        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)',
                        border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit',
                      }}>Edit</button>
                      {canInvite && (
                        <button onClick={async () => {
                          if (!projectSlug) return
                          try {
                            const data = await api.post<{ invites?: InviteResult[] }>('/api/invitations', { slug: projectSlug, personIds: [p.id] })
                            if (data?.invites?.length) {
                              setInviteResults(data.invites)
                            }
                            reload()
                          } catch {
                            showToast('Failed to send invite', 'error')
                          }
                        }} style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: 'var(--accent-text)', background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Invite
                        </button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>

      {/* Nice invite success modal */}
      <Modal
        open={!!inviteResults}
        onClose={() => setInviteResults(null)}
        title="Invites Created"
        footer={
          <button onClick={() => setInviteResults(null)} style={btnStyle()}>
            Close
          </button>
        }
      >
        {inviteResults?.length ? (
          <div>
            <p style={{ marginBottom: 12, fontSize: 13 }}>
              Share these links with the selected people:
            </p>
            <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 12, fontSize: 12, maxHeight: 220, overflow: 'auto' }}>
              {inviteResults.map((inv, i) => (
                <div key={i} style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <strong>{inv.email}</strong>
                  <a href={inv.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', flex: 1, wordBreak: 'break-all' }}>
                    {inv.url}
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(inv.url)}
                    style={{ ...btnStyle('cancel'), fontSize: 10, padding: '2px 8px' }}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12 }}>
              Links expire in 7 days. People will be able to sign up or sign in.
            </p>
          </div>
        ) : (
          <p>Invites created successfully.</p>
        )}
      </Modal>
    </div>
  )
}
