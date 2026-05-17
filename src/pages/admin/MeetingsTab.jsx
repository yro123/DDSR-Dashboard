import { useState, useEffect } from 'react'

const COLORS = ['#6366F1','#14B8A6','#F59E0B','#EF4444','#10B981','#3B82F6','#8B5CF6','#EC4899']

function Btn({ onClick, children, style = {} }) {
  return (
    <button onClick={onClick} style={{
      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7,
      ...style,
    }}>{children}</button>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        border: '1px solid #E2E8F0', borderRadius: 7, padding: '7px 10px',
        fontSize: 13, color: '#0F172A', width: '100%', fontFamily: 'inherit',
      }} />
    </div>
  )
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {COLORS.map(c => (
        <button key={c} onClick={() => onChange(c)} style={{
          width: 20, height: 20, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
          outline: value === c ? `2px solid ${c}` : 'none', outlineOffset: 2,
        }} />
      ))}
    </div>
  )
}

export default function MeetingsTab({ projectSlug, authFetch }) {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [showNewMeeting, setShowNewMeeting] = useState(false)
  const [newMeeting, setNewMeeting] = useState({ meeting_date: '', title: '', meeting_type: 'Weekly Sync', next_meeting: '', display_date: '' })
  const [addingTopicFor, setAddingTopicFor] = useState(null)
  const [newTopic, setNewTopic] = useState({ area: '', color: COLORS[0] })
  const [addingNoteFor, setAddingNoteFor] = useState(null)
  const [newNote, setNewNote] = useState('')
  const [addingActionFor, setAddingActionFor] = useState(null)
  const [newAction, setNewAction] = useState({ action_text: '', assignee_name: '' })
  const [editingMeeting, setEditingMeeting] = useState(null)
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    authFetch(`/api/meetings?slug=${projectSlug}&all=1`)
      .then(r => r.json())
      .then(data => { setMeetings(Array.isArray(data) ? data : []); setLoading(false) })
  }

  useEffect(() => { load() }, [projectSlug])

  async function createMeeting() {
    if (!newMeeting.meeting_date || !newMeeting.title) return
    setSaving(true)
    await authFetch('/api/meetings', {
      method: 'POST',
      body: JSON.stringify({ ...newMeeting, slug: projectSlug }),
    })
    setNewMeeting({ meeting_date: '', title: '', meeting_type: 'Weekly Sync', next_meeting: '', display_date: '' })
    setShowNewMeeting(false)
    setSaving(false)
    load()
  }

  async function saveMeetingEdit(m) {
    setSaving(true)
    await authFetch(`/api/meetings/${m.id}`, { method: 'PUT', body: JSON.stringify(m) })
    setSaving(false)
    setEditingMeeting(null)
    load()
  }

  async function deleteMeeting(id) {
    if (!confirm('Delete this meeting and all its topics/notes?')) return
    await authFetch(`/api/meetings/${id}`, { method: 'DELETE' })
    load()
  }

  async function addTopic(meetingId) {
    if (!newTopic.area) return
    setSaving(true)
    await authFetch('/api/meeting-topics', {
      method: 'POST',
      body: JSON.stringify({ meeting_id: meetingId, ...newTopic }),
    })
    setNewTopic({ area: '', color: COLORS[0] })
    setAddingTopicFor(null)
    setSaving(false)
    load()
  }

  async function deleteTopic(id) {
    if (!confirm('Delete this topic and all its notes/actions?')) return
    await authFetch(`/api/meeting-topics/${id}`, { method: 'DELETE' })
    load()
  }

  async function addNote(topicId) {
    if (!newNote.trim()) return
    setSaving(true)
    await authFetch('/api/meeting-notes', {
      method: 'POST',
      body: JSON.stringify({ topic_id: topicId, note_text: newNote.trim() }),
    })
    setNewNote('')
    setAddingNoteFor(null)
    setSaving(false)
    load()
  }

  async function deleteNote(id) {
    await authFetch(`/api/meeting-notes/${id}`, { method: 'DELETE' })
    load()
  }

  async function addAction(topicId) {
    if (!newAction.action_text.trim()) return
    setSaving(true)
    await authFetch('/api/meeting-action-items', {
      method: 'POST',
      body: JSON.stringify({ topic_id: topicId, ...newAction }),
    })
    setNewAction({ action_text: '', assignee_name: '' })
    setAddingActionFor(null)
    setSaving(false)
    load()
  }

  async function deleteAction(id) {
    await authFetch(`/api/meeting-action-items/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div style={{ color: '#94A3B8', padding: 20 }}>Loading…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Meeting Notes</h2>
        <Btn onClick={() => setShowNewMeeting(!showNewMeeting)} style={{ background: '#1D4ED8', color: '#fff' }}>
          + New Meeting
        </Btn>
      </div>

      {showNewMeeting && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Field label="Date" type="date" value={newMeeting.meeting_date} onChange={v => setNewMeeting(p => ({ ...p, meeting_date: v }))} />
            <Field label="Display Date (e.g. May 19, 2026)" value={newMeeting.display_date} onChange={v => setNewMeeting(p => ({ ...p, display_date: v }))} placeholder="May 19, 2026" />
            <Field label="Title" value={newMeeting.title} onChange={v => setNewMeeting(p => ({ ...p, title: v }))} placeholder="Weekly Sync — Post Go-Live" />
            <Field label="Meeting Type" value={newMeeting.meeting_type} onChange={v => setNewMeeting(p => ({ ...p, meeting_type: v }))} placeholder="Weekly Sync" />
            <Field label="Next Meeting" value={newMeeting.next_meeting} onChange={v => setNewMeeting(p => ({ ...p, next_meeting: v }))} placeholder="Tuesday May 26, 2026" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={createMeeting} style={{ background: '#1D4ED8', color: '#fff' }}>{saving ? 'Saving…' : 'Create Meeting'}</Btn>
            <Btn onClick={() => setShowNewMeeting(false)} style={{ background: '#F1F5F9', color: '#64748B' }}>Cancel</Btn>
          </div>
        </div>
      )}

      {meetings.map(m => {
        const isOpen = openId === m.id
        return (
          <div key={m.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
            {/* Meeting header */}
            {editingMeeting?.id === m.id ? (
              <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <Field label="Date" type="date" value={editingMeeting.meeting_date} onChange={v => setEditingMeeting(p => ({ ...p, meeting_date: v }))} />
                  <Field label="Display Date" value={editingMeeting.display_date} onChange={v => setEditingMeeting(p => ({ ...p, display_date: v }))} />
                  <Field label="Title" value={editingMeeting.title} onChange={v => setEditingMeeting(p => ({ ...p, title: v }))} />
                  <Field label="Meeting Type" value={editingMeeting.meeting_type || ''} onChange={v => setEditingMeeting(p => ({ ...p, meeting_type: v }))} />
                  <Field label="Next Meeting" value={editingMeeting.next_meeting || ''} onChange={v => setEditingMeeting(p => ({ ...p, next_meeting: v }))} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={() => saveMeetingEdit(editingMeeting)} style={{ background: '#1D4ED8', color: '#fff' }}>{saving ? 'Saving…' : 'Save'}</Btn>
                  <Btn onClick={() => setEditingMeeting(null)} style={{ background: '#F1F5F9', color: '#64748B' }}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                <button onClick={() => setOpenId(isOpen ? null : m.id)} style={{
                  flex: 1, textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    {m.display_date || m.meeting_date} · {(m.topics || []).length} topics
                  </div>
                </button>
                <Btn onClick={() => setEditingMeeting({ ...m })} style={{ background: '#F1F5F9', color: '#64748B' }}>Edit</Btn>
                <Btn onClick={() => deleteMeeting(m.id)} style={{ background: '#FEF2F2', color: '#EF4444' }}>Delete</Btn>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            )}

            {/* Topics */}
            {isOpen && (
              <div style={{ borderTop: '1px solid #F1F5F9', padding: '14px 16px' }}>
                {(m.topics || []).map(t => (
                  <div key={t.id} style={{ border: `1.5px solid ${t.color}30`, borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{ background: t.color + '12', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', flex: 1 }}>{t.area}</span>
                      <Btn onClick={() => deleteTopic(t.id)} style={{ background: '#FEF2F2', color: '#EF4444', padding: '2px 8px' }}>×</Btn>
                    </div>
                    <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {/* Notes */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Notes</div>
                        {(t.notes || []).map((n, i) => (
                          <div key={n.id || i} style={{ display: 'flex', gap: 6, padding: '4px 0', fontSize: 12, color: '#0F172A', alignItems: 'flex-start' }}>
                            <span style={{ color: t.color, flexShrink: 0 }}>•</span>
                            <span style={{ flex: 1 }}>{n.note_text || n}</span>
                            <button onClick={() => deleteNote(n.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: 12, padding: 0, flexShrink: 0 }}>×</button>
                          </div>
                        ))}
                        {addingNoteFor === t.id ? (
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNote(t.id)}
                              placeholder="Note text…" autoFocus style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit' }} />
                            <Btn onClick={() => addNote(t.id)} style={{ background: '#1D4ED8', color: '#fff', padding: '4px 8px' }}>+</Btn>
                            <Btn onClick={() => { setAddingNoteFor(null); setNewNote('') }} style={{ background: '#F1F5F9', color: '#64748B', padding: '4px 8px' }}>×</Btn>
                          </div>
                        ) : (
                          <button onClick={() => setAddingNoteFor(t.id)} style={{ fontSize: 11, color: '#94A3B8', border: 'none', background: 'none', cursor: 'pointer', marginTop: 4, fontFamily: 'inherit' }}>+ Add note</button>
                        )}
                      </div>
                      {/* Actions */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Action Items</div>
                        {(t.actionItems || []).map((a, i) => (
                          <div key={a.id} style={{ display: 'flex', gap: 6, padding: '4px 0', fontSize: 12, color: '#0F172A', alignItems: 'flex-start' }}>
                            <span style={{ background: '#1D4ED8', color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 700, padding: '1px 5px', flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                            <span style={{ flex: 1 }}>{a.action_text}{a.assignee_name ? ` (${a.assignee_name})` : ''}</span>
                            <button onClick={() => deleteAction(a.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: 12, padding: 0, flexShrink: 0 }}>×</button>
                          </div>
                        ))}
                        {addingActionFor === t.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                            <input value={newAction.action_text} onChange={e => setNewAction(p => ({ ...p, action_text: e.target.value }))}
                              placeholder="Action item…" autoFocus style={{ border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit' }} />
                            <input value={newAction.assignee_name} onChange={e => setNewAction(p => ({ ...p, assignee_name: e.target.value }))}
                              placeholder="Assignee (optional)" style={{ border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit' }} />
                            <div style={{ display: 'flex', gap: 4 }}>
                              <Btn onClick={() => addAction(t.id)} style={{ background: '#1D4ED8', color: '#fff', padding: '4px 8px' }}>+</Btn>
                              <Btn onClick={() => { setAddingActionFor(null); setNewAction({ action_text: '', assignee_name: '' }) }} style={{ background: '#F1F5F9', color: '#64748B', padding: '4px 8px' }}>×</Btn>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setAddingActionFor(t.id)} style={{ fontSize: 11, color: '#94A3B8', border: 'none', background: 'none', cursor: 'pointer', marginTop: 4, fontFamily: 'inherit' }}>+ Add action</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add topic */}
                {addingTopicFor === m.id ? (
                  <div style={{ border: '1px dashed #CBD5E1', borderRadius: 10, padding: 14 }}>
                    <div style={{ marginBottom: 10 }}>
                      <Field label="Topic / Area" value={newTopic.area} onChange={v => setNewTopic(p => ({ ...p, area: v }))} placeholder="e.g. Financial Close" />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Color</label>
                      <ColorPicker value={newTopic.color} onChange={v => setNewTopic(p => ({ ...p, color: v }))} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn onClick={() => addTopic(m.id)} style={{ background: '#1D4ED8', color: '#fff' }}>{saving ? 'Saving…' : 'Add Topic'}</Btn>
                      <Btn onClick={() => { setAddingTopicFor(null); setNewTopic({ area: '', color: COLORS[0] }) }} style={{ background: '#F1F5F9', color: '#64748B' }}>Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingTopicFor(m.id)} style={{
                    width: '100%', border: '1px dashed #CBD5E1', borderRadius: 10, padding: '10px',
                    fontSize: 13, color: '#94A3B8', cursor: 'pointer', background: 'none', fontFamily: 'inherit',
                  }}>
                    + Add Topic
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {meetings.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: 40, fontSize: 14 }}>
          No meetings yet. Click "+ New Meeting" to add one.
        </div>
      )}
    </div>
  )
}
