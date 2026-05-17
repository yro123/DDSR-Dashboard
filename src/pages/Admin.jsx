import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useProject } from '../context/ProjectContext'
import MeetingsTab from './admin/MeetingsTab'
import PeopleTab from './admin/PeopleTab'
import DocumentsTab from './admin/DocumentsTab'
import ProjectTab from './admin/ProjectTab'
import ClientsTab from './admin/ClientsTab'

const TABS = ['Meetings', 'People', 'Documents', 'Project Settings', 'Clients']

export default function Admin() {
  const { isAdmin, clientSlug, allProjects, slug: urlSlug, authFetch } = useProject()
  const [tab, setTab] = useState('Meetings')
  const [projectSlug, setProjectSlug] = useState('')

  useEffect(() => {
    if (!projectSlug && allProjects.length > 0) {
      setProjectSlug(urlSlug || allProjects[0].slug)
    }
  }, [allProjects, urlSlug])

  if (!isAdmin) {
    return <Navigate to={`/${clientSlug || 'hinckley'}/tasks`} replace />
  }

  const currentProject = allProjects.find(p => p.slug === projectSlug) || allProjects[0]

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Top bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E2E8F0',
        padding: '0 32px', display: 'flex', alignItems: 'center', gap: 24, height: 56,
      }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', letterSpacing: '-.01em' }}>
          Admin Panel
        </span>
        <div style={{ display: 'flex', gap: 2, background: '#F1F5F9', borderRadius: 8, padding: 3 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? '#0F172A' : '#64748B',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            }}>{t}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {tab !== 'Clients' && (
            <select
              value={projectSlug}
              onChange={e => setProjectSlug(e.target.value)}
              style={{
                border: '1px solid #E2E8F0', borderRadius: 8, padding: '5px 10px',
                fontSize: 13, color: '#0F172A', background: '#fff', cursor: 'pointer',
              }}
            >
              {allProjects.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          )}
          <a href={`/${projectSlug}/tasks`} style={{
            fontSize: 12, color: '#64748B', textDecoration: 'none',
            padding: '5px 12px', border: '1px solid #E2E8F0', borderRadius: 7,
          }}>
            Back to Dashboard
          </a>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
        {tab === 'Meetings'          && <MeetingsTab  projectSlug={projectSlug} authFetch={authFetch} />}
        {tab === 'People'            && <PeopleTab    projectSlug={projectSlug} authFetch={authFetch} currentProject={currentProject} />}
        {tab === 'Documents'         && <DocumentsTab projectSlug={projectSlug} authFetch={authFetch} />}
        {tab === 'Project Settings'  && <ProjectTab   projectSlug={projectSlug} authFetch={authFetch} />}
        {tab === 'Clients'           && <ClientsTab   authFetch={authFetch} />}
      </div>
    </div>
  )
}
