import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useProject } from '../context/ProjectContext'
import { useTheme } from '../context/ThemeContext'
import MeetingsTab from './admin/MeetingsTab'
import PeopleTab from './admin/PeopleTab'
import DocumentsTab from './admin/DocumentsTab'
import ProjectTab from './admin/ProjectTab'
import ClientsTab from './admin/ClientsTab'
import ConfigTab from './admin/ConfigTab'
import UsersTab from './admin/UsersTab'

const TABS = ['Meetings', 'People', 'Documents', 'Project Settings', 'Config', 'Clients', 'Users']

export default function Admin() {
  const { isAdmin, allProjects, current } = useProject()
  const { dark, toggle } = useTheme()
  const [tab, setTab] = useState('Meetings')

  // Local selection for tabs that scope to a specific PROJECT (People, Documents, Project Settings, Config, Meetings).
  // This is independent of the main sidebar selection because Admin is a global view.
  const [adminProjectSlug, setAdminProjectSlug] = useState('')

  // Default the admin-scoped project selector to the current project or first available.
  useEffect(() => {
    if (!adminProjectSlug && allProjects.length > 0) {
      const preferred = current?.slug || allProjects[0]?.slug
      if (preferred) setAdminProjectSlug(preferred)
    }
  }, [allProjects, current, adminProjectSlug])

  if (!isAdmin) {
    // Non-admins should not reach the full admin panel.
    const fallback = current?.slug || allProjects[0]?.slug
    return <Navigate to={fallback ? `/${fallback}/tasks` : '/'} replace />
  }

  const showClientSelector = !['Clients', 'Users'].includes(tab)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', gap: 20, height: 60,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,.08)',
      }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>
          Admin Panel
        </span>

        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', borderRadius: 8, padding: 3 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '5px 13px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              background: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? 'var(--accent-text)' : 'var(--text-muted)',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.15)' : 'none',
              transition: 'background .15s, color .15s',
            }}>{t}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {showClientSelector && allProjects.length > 0 && (
            <select
              value={adminProjectSlug}
              onChange={e => setAdminProjectSlug(e.target.value)}
              style={{
                border: '1px solid var(--border)', borderRadius: 7, padding: '5px 10px',
                fontSize: 12, color: 'var(--text)', background: 'var(--surface)', cursor: 'pointer',
              }}
            >
              {allProjects.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="theme-toggle" onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? '☀' : '☾'}
          </button>
          {adminProjectSlug && (
            <a href={`/${adminProjectSlug}/tasks`} style={{
              fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none',
              padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 7,
              background: 'var(--surface)',
            }}>
              ← Back to {adminProjectSlug}
            </a>
          )}
        </div>
      </div>

      {/* Tab content — pass the admin-selected PROJECT slug to every project-scoped tab */}
      <div style={{ padding: '28px 32px', maxWidth: 980, margin: '0 auto' }}>
        {tab === 'Meetings'          && <MeetingsTab  projectSlug={adminProjectSlug} />}
        {tab === 'People'            && <PeopleTab    projectSlug={adminProjectSlug} />}
        {tab === 'Documents'         && <DocumentsTab projectSlug={adminProjectSlug} />}
        {tab === 'Project Settings'  && <ProjectTab   projectSlug={adminProjectSlug} />}
        {tab === 'Config'            && <ConfigTab    projectSlug={adminProjectSlug} />}
        {tab === 'Clients'           && <ClientsTab   />}
        {tab === 'Users'             && <UsersTab     />}
      </div>
    </div>
  )
}
