import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useProject } from '../context/ProjectContext'
import { StatusPill } from '../components/Pill'

function fmtDate(d) {
  if (!d) return ''
  try {
    const [, m, dy] = d.split('-')
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1] + ' ' + parseInt(dy)
  } catch { return '' }
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const { authFetch, isAdmin } = useProject()
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    if (q.length < 3) { setResults([]); setLoading(false); return }
    setLoading(true)
    authFetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => { setResults(Array.isArray(data) ? data : []); setLoading(false) })
  }, [q, isAdmin])

  return (
    <Layout>
      <div>
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-dim)' }}>
          {loading ? 'Searching…'
            : q.length < 3 ? 'Type at least 3 characters to search.'
            : `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`}
        </div>

        {results.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  {['Project', 'Task', 'Assignee', 'Status', 'Due'].map(h => (
                    <th key={h} style={{
                      padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                      color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.04em',
                      borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/${t.project_slug}/tasks`)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {t.project_name}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                      {t.title}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {t.assignee_name || '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusPill status={t.status} />
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {fmtDate(t.due_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && q.length >= 3 && results.length === 0 && (
          <div style={{ color: 'var(--text-dim)', padding: 40, textAlign: 'center', fontSize: 13 }}>
            No tasks found matching "{q}"
          </div>
        )}
      </div>
    </Layout>
  )
}
