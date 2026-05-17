import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { useProject } from '../context/ProjectContext'
import { useTheme } from '../context/ThemeContext'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { allProjects, current, slug, isAdmin, clientSlug } = useProject()
  const { dark, toggle } = useTheme()

  const screen = pathname.includes('hub') ? 'hub' : pathname.includes('meetings') ? 'meetings' : 'tasks'

  useEffect(() => {
    if (!isAdmin && clientSlug && slug !== clientSlug) {
      navigate(`/${clientSlug}/tasks`, { replace: true })
    }
  }, [isAdmin, clientSlug, slug])

  function handleProjectChange(e) {
    navigate(`/${e.target.value}/${screen}`)
  }

  return (
    <div>
      <div className="topbar">
        {/* Logo */}
        <img
          src="/ddsr-logo.png"
          alt="DDSR"
          className="topbar-logo"
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="topbar-divider" />

        {/* Project name */}
        <div className="topbar-left">
          <h1>{current?.name || 'Dashboard'}</h1>
          {current?.subtitle && <div className="sub">{current.subtitle}</div>}
        </div>

        {/* Right side */}
        <div className="topbar-right">
          {isAdmin && allProjects.length > 1 && (
            <select className="sel" value={slug || ''} onChange={handleProjectChange}>
              {allProjects.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          )}

          <div className="toggle">
            <button className={screen === 'tasks'    ? 'on' : ''} onClick={() => navigate(`/${slug}/tasks`)}>Tasks</button>
            <button className={screen === 'hub'      ? 'on' : ''} onClick={() => navigate(`/${slug}/hub`)}>Process Hub</button>
            <button className={screen === 'meetings' ? 'on' : ''} onClick={() => navigate(`/${slug}/meetings`)}>Meeting Notes</button>
            {isAdmin && (
              <button className={screen === 'admin' ? 'on' : ''} onClick={() => navigate('/admin')}>Admin</button>
            )}
          </div>

          <button
            className="btn btn-pdf"
            onClick={() => window.print()}
            title="Export to PDF"
            style={{ fontSize: 11 }}
          >
            PDF
          </button>

          <button
            className="theme-toggle"
            onClick={toggle}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? '☀' : '☾'}
          </button>

          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 0 }}>
        {children}
      </div>
    </div>
  )
}
