import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useProject } from '../context/ProjectContext'

export default function Meetings() {
  const { slug, authFetch } = useProject()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [openId, setOpenId]     = useState(null)

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/meetings?slug=${slug}`).then(r => r.json()).then(data => { setMeetings(data); setLoading(false) })
  }, [slug, authFetch])

  if (loading) return <Layout><div style={{ padding: 40, color: 'var(--text-dim)' }}>Loading…</div></Layout>

  return (
    <Layout>
      <div style={{ maxWidth: 900 }}>
        {meetings.map(m => {
          const isOpen = openId === m.id
          const dateParts = (m.display_date || '').split(' ')
          return (
            <div key={m.id} className="meeting-card">
              {/* Header */}
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
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Body */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: 20 }}>
                  {(m.topics || []).map(t => (
                    <div key={t.id} style={{ border: `1.5px solid ${t.color}30`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                      {/* Topic header */}
                      <div style={{
                        background: t.color + '14', padding: '10px 16px',
                        borderBottom: `1px solid ${t.color}20`,
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t.area}</span>
                      </div>
                      {/* Notes + Actions */}
                      <div style={{ background: 'var(--surface)', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                            Discussion Notes
                          </div>
                          {(t.notes || []).map((n, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                              <span style={{ color: t.color, flexShrink: 0, marginTop: 2 }}>•</span>
                              <span>{n.note_text || n}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                            Action Items
                          </div>
                          {(t.actionItems || []).map((a, i) => (
                            <div key={a.id} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                              <span style={{ background: 'var(--accent)', color: 'var(--accent-text)', borderRadius: 99, fontSize: 9, fontWeight: 700, padding: '1px 6px', flexShrink: 0, marginTop: 2 }}>
                                {i + 1}
                              </span>
                              <span style={{ flex: 1 }}>{a.action_text}</span>
                              {a.assignee_name && (
                                <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>({a.assignee_name})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {m.next_meeting && m.next_meeting !== 'TBD' && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', padding: '4px 2px' }}>
                      Next meeting: {m.next_meeting}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
