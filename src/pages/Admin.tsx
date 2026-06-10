import { useState, useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useProject } from '../context/ProjectContext'
import MeetingsTab from './admin/MeetingsTab'
import PeopleTab from './admin/PeopleTab'
import DocumentsTab from './admin/DocumentsTab'
import ProjectTab from './admin/ProjectTab'
import ClientsTab from './admin/ClientsTab'
import ConfigTab from './admin/ConfigTab'
import UsersTab from './admin/UsersTab'

type Tab = 'Meetings' | 'People' | 'Documents' | 'Project Settings' | 'Config' | 'Clients' | 'Users'

// URL slug (/admin/<slug>) ↔ tab label. Drives the sidebar Admin sublist.
const TAB_BY_SLUG: Record<string, Tab> = {
  meetings: 'Meetings',
  people: 'People',
  documents: 'Documents',
  'project-settings': 'Project Settings',
  config: 'Config',
  clients: 'Clients',
  users: 'Users',
}

export default function Admin() {
  const { isAdmin, allProjects, current } = useProject()
  const { tab: tabSlug } = useParams()
  const tab: Tab = TAB_BY_SLUG[tabSlug ?? 'meetings'] ?? 'Meetings'

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
    // Non-admins should not reach the admin panel.
    const fallback = current?.slug || allProjects[0]?.slug
    return <Navigate to={fallback ? `/${fallback}/tasks` : '/'} replace />
  }

  const showClientSelector = !['Clients', 'Users'].includes(tab)

  return (
    <Layout>
      <div style={{ padding: '24px 32px', maxWidth: 980, margin: '0 auto' }}>
        {/* Section heading + project selector (sidebar drives which tab is shown) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{tab}</h1>
          {showClientSelector && allProjects.length > 0 && (
            <select
              value={adminProjectSlug}
              onChange={e => setAdminProjectSlug(e.target.value)}
              style={{
                marginLeft: 'auto',
                border: '1px solid var(--border)', borderRadius: 7, padding: '5px 10px',
                fontSize: 12, color: 'var(--text)', background: 'var(--surface)', cursor: 'pointer',
              }}
            >
              {allProjects.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tab content — pass the admin-selected PROJECT slug to every project-scoped tab */}
        {tab === 'Meetings'          && <MeetingsTab  projectSlug={adminProjectSlug} />}
        {tab === 'People'            && <PeopleTab    projectSlug={adminProjectSlug} />}
        {tab === 'Documents'         && <DocumentsTab projectSlug={adminProjectSlug} />}
        {tab === 'Project Settings'  && <ProjectTab   projectSlug={adminProjectSlug} />}
        {tab === 'Config'            && <ConfigTab    projectSlug={adminProjectSlug} />}
        {tab === 'Clients'           && <ClientsTab   />}
        {tab === 'Users'             && <UsersTab     />}
      </div>
    </Layout>
  )
}
