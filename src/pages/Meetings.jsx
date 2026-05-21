import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useProject } from '../context/ProjectContext'
import { useConfig } from '../context/ConfigContext'

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
const btnDanger = {
  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
  border: 'none', background: 'transparent', color: 'var(--text-dim)',
  cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
}
const btnAdd = {
  fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)',
  border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
  fontFamily: 'inherit', flexShrink: 0,
}
const inputStyle = {
  border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px',
  fontSize: 12, fontFamily: 'inherit', color: 'var(--text)',
  background: 'var(--surface)', width: '100%',
}
const labelStyle = {
  fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
  textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 4,
}

function fmtDisplayDate(isoDate) {
  if (!isoDate) return ''
  try {
    const [y, m, d] = isoDate.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[+m - 1]} ${parseInt(d)}, ${y}`
  } catch { return isoDate }
}

function MeetingForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    meeting_date: initial?.meeting_date || '',
    location: initial?.location || '',
    next_meeting: initial?.next_meeting || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Meeting title" style={inputStyle} autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Date *</label>
          <input type="date" value={form.meeting_date} onChange={e => set('meeting_date', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Location</label>
          <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Zoom / in-person" style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Next Meeting</label>
          <input value={form.next_meeting} onChange={e => set('next_meeting', e.target.value)} placeholder="e.g. April 5, 2025" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onSave({ ...form, display_date: fmtDisplayDate(form.meeting_date) })} style={btnSave}>Save</button>
        <button onClick={onCancel} style={btnCancel}>Cancel</button>
      </div>
    </div>
  )
}

function TopicForm({ initial, onSave, onCancel }) {
  const { getOptions } = useConfig()
  const topicColors = getOptions('topic_color')
  const [area, setArea]   = useState(initial?.area || '')
  const [color, setColor] = useState(initial?.color || topicColors[0] || '#3B82F6')
  return (
    <div style={{ border: '1px dashed var(--border-mid)', borderRadius: 10, padding: 12, marginTop: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>Topic Area *</label>
        <input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. NetSuite Integration" style={inputStyle} autoFocus />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Color</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {topicColors.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 22, height: 22, borderRadius: '50%', background: c, border: 'none',
              cursor: 'pointer', boxShadow: color === c ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : 'none',
              transition: 'box-shadow .12s',
            }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { if (area.trim()) onSave({ area: area.trim(), color }) }} style={btnSave}>Save</button>
        <button onClick={onCancel} style={btnCancel}>Cancel</button>
      </div>
    </div>
  )
}

export default function Meetings() {
  const { slug, authFetch, isAdmin } = useProject()
  const [meetings, setMeetings] = useState([])
  const [people, setPeople]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [openId, setOpenId]     = useState(null)

  // Meeting-level state
  const [addingNew, setAddingNew]         = useState(false)
  const [editingMeetingId, setEditMeeting] = useState(null)

  // Topic state
  const [addingTopicFor, setAddingTopicFor] = useState(null)
  const [editingTopicId, setEditTopicId]    = useState(null)

  // Note state
  const [editingNoteId, setEditNoteId] = useState(null)
  const [noteText, setNoteText]        = useState('')
  const [addingNoteFor, setAddingNoteFor] = useState(null)
  const [newNoteText, setNewNoteText]     = useState('')

  // Action item state
  const [editingActionId, setEditActionId] = useState(null)
  const [actionForm, setActionForm]        = useState({ action_text: '', assignee_name: '' })
  const [addingActionFor, setAddingActionFor] = useState(null)
  const [newActionForm, setNewActionForm]     = useState({ action_text: '', assignee_name: '' })

  useEffect(() => {
    setLoading(true)
    const endpoint = isAdmin ? `&all=1` : ''
    Promise.all([
      authFetch(`/api/meetings?slug=${slug}${endpoint}`).then(r => r.json()),
      authFetch(`/api/people?slug=${slug}`).then(r => r.json()),
    ]).then(([m, p]) => { setMeetings(Array.isArray(m) ? m : []); setPeople(Array.isArray(p) ? p : []); setLoading(false) })
  }, [slug, authFetch, isAdmin])

  const reload = () => {
    const endpoint = isAdmin ? `&all=1` : ''
    authFetch(`/api/meetings?slug=${slug}${endpoint}`).then(r => r.json()).then(m => setMeetings(Array.isArray(m) ? m : []))
  }

  // Meeting CRUD
  async function createMeeting(data) {
    if (!data.title || !data.meeting_date) return
    await authFetch('/api/meetings', { method: 'POST', body: JSON.stringify({ slug, ...data }) })
    setAddingNew(false); reload()
  }
  async function updateMeeting(id, data) {
    await authFetch(`/api/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    setEditMeeting(null); reload()
  }
  async function deleteMeeting(id) {
    if (!confirm('Delete this meeting and all its topics?')) return
    await authFetch(`/api/meetings/${id}`, { method: 'DELETE' }); reload()
  }

  // Topic CRUD
  async function createTopic(meetingId, data) {
    await authFetch('/api/meeting-topics', { method: 'POST', body: JSON.stringify({ meeting_id: meetingId, ...data }) })
    setAddingTopicFor(null); reload()
  }
  async function updateTopic(id, data) {
    await authFetch(`/api/meeting-topics/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    setEditTopicId(null); reload()
  }
  async function deleteTopic(id) {
    if (!confirm('Delete this topic and all its notes?')) return
    await authFetch(`/api/meeting-topics/${id}`, { method: 'DELETE' }); reload()
  }

  // Note CRUD
  async function createNote(topicId) {
    if (!newNoteText.trim()) return
    await authFetch('/api/meeting-notes', { method: 'POST', body: JSON.stringify({ topic_id: topicId, note_text: newNoteText }) })
    setAddingNoteFor(null); setNewNoteText(''); reload()
  }
  async function updateNote(id) {
    await authFetch(`/api/meeting-notes/${id}`, { method: 'PUT', body: JSON.stringify({ note_text: noteText }) })
    setEditNoteId(null); reload()
  }
  async function deleteNote(id) {
    await authFetch(`/api/meeting-notes/${id}`, { method: 'DELETE' }); reload()
  }

  // Action CRUD
  async function createAction(topicId) {
    if (!newActionForm.action_text.trim()) return
    await authFetch('/api/meeting-action-items', { method: 'POST', body: JSON.stringify({ topic_id: topicId, ...newActionForm }) })
    setAddingActionFor(null); setNewActionForm({ action_text: '', assignee_name: '' }); reload()
  }
  async function updateAction(id) {
    await authFetch(`/api/meeting-action-items/${id}`, { method: 'PUT', body: JSON.stringify(actionForm) })
    setEditActionId(null); reload()
  }
  async function deleteAction(id) {
    await authFetch(`/api/meeting-action-items/${id}`, { method: 'DELETE' }); reload()
  }

  if (loading) return <Layout><div style={{ padding: 40, color: 'var(--text-dim)' }}>Loading…</div></Layout>

  return (
    <Layout>
      <div style={{ maxWidth: 900 }}>

        {/* Admin: New Meeting */}
        {isAdmin && (
          <div style={{ marginBottom: 16 }}>
            {addingNew ? (
              <MeetingForm onSave={createMeeting} onCancel={() => setAddingNew(false)} />
            ) : (
              <button onClick={() => setAddingNew(true)} style={{ ...btnSave, fontSize: 12, padding: '6px 14px' }}>
                + New Meeting
              </button>
            )}
          </div>
        )}

        {meetings.map(m => {
          const isOpen = openId === m.id
          const dateParts = (m.display_date || '').split(' ')
          const isEditing = editingMeetingId === m.id

          return (
            <div key={m.id} className="meeting-card">
              {/* Header */}
              {isEditing ? (
                <div style={{ padding: '12px 20px' }}>
                  <MeetingForm initial={m} onSave={data => updateMeeting(m.id, data)} onCancel={() => setEditMeeting(null)} />
                </div>
              ) : (
                <button onClick={() => setOpenId(isOpen ? null : m.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px',
                  background: isOpen ? 'var(--surface-2)' : 'var(--surface)',
                  border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'var(--accent-dim)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {dateParts[0] || ''}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                      {(dateParts[1] || '').replace(',', '')}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{(m.attendees || []).join(' · ')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 10px', borderRadius: 99 }}>
                      {(m.topics || []).length} topics
                    </span>
                    {isAdmin && (
                      <>
                        <span onClick={e => { e.stopPropagation(); setEditMeeting(m.id) }}
                          style={{ fontSize: 10, color: 'var(--text-dim)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, background: 'var(--surface-2)' }}>
                          Edit
                        </span>
                        <span onClick={e => { e.stopPropagation(); deleteMeeting(m.id) }}
                          style={{ fontSize: 10, color: 'var(--red)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, background: 'var(--surface-2)' }}>
                          Delete
                        </span>
                      </>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>
              )}

              {/* Body */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: 20 }}>
                  {(m.topics || []).map(t => (
                    <div key={t.id} style={{ border: `1.5px solid ${t.color}30`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                      {/* Topic header */}
                      {editingTopicId === t.id ? (
                        <div style={{ padding: '10px 16px', background: t.color + '14' }}>
                          <TopicForm initial={t} onSave={data => updateTopic(t.id, data)} onCancel={() => setEditTopicId(null)} />
                        </div>
                      ) : (
                        <div style={{
                          background: t.color + '14', padding: '10px 16px',
                          borderBottom: `1px solid ${t.color}20`,
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0, display: 'inline-block' }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{t.area}</span>
                          {isAdmin && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => setEditTopicId(t.id)} style={{ ...btnDanger, fontSize: 10, padding: '2px 7px', background: 'var(--surface-2)' }}>Edit</button>
                              <button onClick={() => deleteTopic(t.id)} style={{ ...btnDanger, color: 'var(--red)' }}>✕</button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes + Actions */}
                      <div style={{ background: 'var(--surface)', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Discussion Notes */}
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                            Discussion Notes
                          </div>
                          {(t.notes || []).map(n => (
                            <div key={n.id}>
                              {editingNoteId === n.id ? (
                                <div style={{ padding: '4px 0 8px', borderBottom: '1px solid var(--border)' }}>
                                  <textarea
                                    value={noteText}
                                    onChange={e => setNoteText(e.target.value)}
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'vertical', marginBottom: 6 }}
                                    autoFocus
                                  />
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => updateNote(n.id)} style={btnSave}>Save</button>
                                    <button onClick={() => setEditNoteId(null)} style={btnCancel}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                                  <span style={{ color: t.color, flexShrink: 0, marginTop: 2 }}>•</span>
                                  <span style={{ flex: 1 }}
                                    onClick={isAdmin ? () => { setEditNoteId(n.id); setNoteText(n.note_text || n) } : undefined}
                                    title={isAdmin ? 'Click to edit' : undefined}
                                    style={{ cursor: isAdmin ? 'pointer' : 'default', flex: 1 }}
                                  >{n.note_text || n}</span>
                                  {isAdmin && (
                                    <button onClick={() => deleteNote(n.id)} style={btnDanger} title="Delete note">✕</button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Add note */}
                          {isAdmin && (
                            addingNoteFor === t.id ? (
                              <div style={{ padding: '8px 0' }}>
                                <textarea
                                  value={newNoteText}
                                  onChange={e => setNewNoteText(e.target.value)}
                                  rows={2}
                                  placeholder="Note text…"
                                  style={{ ...inputStyle, resize: 'vertical', marginBottom: 6 }}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => createNote(t.id)} style={btnSave}>Add</button>
                                  <button onClick={() => { setAddingNoteFor(null); setNewNoteText('') }} style={btnCancel}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setAddingNoteFor(t.id); setNewNoteText('') }} style={{ ...btnAdd, marginTop: 6, fontSize: 10 }}>+ Add Note</button>
                            )
                          )}
                        </div>

                        {/* Action Items */}
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                            Action Items
                          </div>
                          {(t.actionItems || []).map((a, i) => (
                            <div key={a.id}>
                              {editingActionId === a.id ? (
                                <div style={{ padding: '4px 0 8px', borderBottom: '1px solid var(--border)' }}>
                                  <input
                                    value={actionForm.action_text}
                                    onChange={e => setActionForm(f => ({ ...f, action_text: e.target.value }))}
                                    placeholder="Action text…"
                                    style={{ ...inputStyle, marginBottom: 6 }}
                                    autoFocus
                                  />
                                  <select
                                    value={actionForm.assignee_name}
                                    onChange={e => setActionForm(f => ({ ...f, assignee_name: e.target.value }))}
                                    style={{ ...inputStyle, marginBottom: 6 }}
                                  >
                                    <option value="">— assignee —</option>
                                    {people.map(p => <option key={p.id}>{p.name}</option>)}
                                  </select>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => updateAction(a.id)} style={btnSave}>Save</button>
                                    <button onClick={() => setEditActionId(null)} style={btnCancel}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                                  <span style={{ background: 'var(--accent)', color: 'var(--accent-text)', borderRadius: 99, fontSize: 9, fontWeight: 700, padding: '1px 6px', flexShrink: 0, marginTop: 2 }}>
                                    {i + 1}
                                  </span>
                                  <span
                                    style={{ flex: 1, cursor: isAdmin ? 'pointer' : 'default' }}
                                    onClick={isAdmin ? () => { setEditActionId(a.id); setActionForm({ action_text: a.action_text, assignee_name: a.assignee_name || '' }) } : undefined}
                                    title={isAdmin ? 'Click to edit' : undefined}
                                  >{a.action_text}</span>
                                  {a.assignee_name && (
                                    <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>({a.assignee_name})</span>
                                  )}
                                  {isAdmin && (
                                    <button onClick={() => deleteAction(a.id)} style={btnDanger} title="Delete action">✕</button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Add action */}
                          {isAdmin && (
                            addingActionFor === t.id ? (
                              <div style={{ padding: '8px 0' }}>
                                <input
                                  value={newActionForm.action_text}
                                  onChange={e => setNewActionForm(f => ({ ...f, action_text: e.target.value }))}
                                  placeholder="Action item text…"
                                  style={{ ...inputStyle, marginBottom: 6 }}
                                  autoFocus
                                />
                                <select
                                  value={newActionForm.assignee_name}
                                  onChange={e => setNewActionForm(f => ({ ...f, assignee_name: e.target.value }))}
                                  style={{ ...inputStyle, marginBottom: 6 }}
                                >
                                  <option value="">— assignee —</option>
                                  {people.map(p => <option key={p.id}>{p.name}</option>)}
                                </select>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => createAction(t.id)} style={btnSave}>Add</button>
                                  <button onClick={() => { setAddingActionFor(null); setNewActionForm({ action_text: '', assignee_name: '' }) }} style={btnCancel}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setAddingActionFor(t.id); setNewActionForm({ action_text: '', assignee_name: '' }) }} style={{ ...btnAdd, marginTop: 6, fontSize: 10 }}>+ Add Action</button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add topic */}
                  {isAdmin && (
                    addingTopicFor === m.id ? (
                      <TopicForm onSave={data => createTopic(m.id, data)} onCancel={() => setAddingTopicFor(null)} />
                    ) : (
                      <button onClick={() => setAddingTopicFor(m.id)} style={{ ...btnAdd, marginTop: 4 }}>+ Add Topic</button>
                    )
                  )}

                  {m.next_meeting && m.next_meeting !== 'TBD' && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', padding: '8px 2px 0' }}>
                      Next meeting: {m.next_meeting}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {meetings.length === 0 && !addingNew && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40, fontSize: 13 }}>
            No meetings yet.{isAdmin && ' Click "+ New Meeting" to add one.'}
          </div>
        )}
      </div>
    </Layout>
  )
}
