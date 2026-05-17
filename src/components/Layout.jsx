import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { useProject } from '../context/ProjectContext'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { allProjects, current, slug, isAdmin, clientSlug } = useProject()

  const screen = pathname.includes('hub') ? 'hub' : pathname.includes('meetings') ? 'meetings' : 'tasks'

  // Redirect client users away from projects they don't own
  useEffect(() => {
    if (!isAdmin && clientSlug && slug !== clientSlug) {
      navigate(`/${clientSlug}/tasks`, { replace: true })
    }
  }, [isAdmin, clientSlug, slug])

  function handleProjectChange(e) {
    navigate(`/${e.target.value}/${screen}`)
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="topbar-left">
          <h1>{current?.name || 'Dashboard'}</h1>
          <div className="sub">{current?.subtitle || 'Project implementation dashboard'}</div>
        </div>
        <div className="topbar-right">
          {isAdmin && allProjects.length > 1 && (
            <select
              className="sel"
              value={slug || ''}
              onChange={handleProjectChange}
              style={{ marginRight: 8 }}
            >
              {allProjects.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="btn btn-pdf" onClick={() => window.print()}>📄 PDF</button>
          <div className="toggle">
            <button className={screen === 'tasks'    ? 'on' : ''} onClick={() => navigate(`/${slug}/tasks`)}>☑ Tasks</button>
            <button className={screen === 'hub'      ? 'on' : ''} onClick={() => navigate(`/${slug}/hub`)}>⬡ Process Hub</button>
            <button className={screen === 'meetings' ? 'on' : ''} onClick={() => navigate(`/${slug}/meetings`)}>📋 Meeting Notes</button>
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
      {children}
    </div>
  )
}
