import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authClient } from '../lib/auth-client'
import { useProject } from '../context/ProjectContext'
import { useTheme } from '../context/ThemeContext'

function UserMenu() {
  const { data: session } = authClient.useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const user = session?.user

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = (user?.name || user?.email || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const signOut = async () => {
    await authClient.signOut()
    window.location.href = '/sign-in'
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: 30, height: 30, borderRadius: '50%',
        background: '#00D4C8', color: '#0A0A0A',
        border: 'none', cursor: 'pointer',
        fontSize: 11, fontWeight: 800, fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{initials}</button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 38, width: 210,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.2)',
          padding: 8, zIndex: 200,
        }}>
          <div style={{ padding: '6px 10px 10px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={signOut} style={{
            width: '100%', textAlign: 'left', padding: '7px 10px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text-muted)', fontFamily: 'inherit',
            borderRadius: 6,
          }}>Sign out</button>
        </div>
      )}
    </div>
  )
}

const IconTasks = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
)

const IconHub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)

const IconMeetings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const IconAdmin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const IconReview = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const PAGE_TITLES = {
  tasks:    'Tasks',
  hub:      'Process Hub',
  meetings: 'Meeting Notes',
  review:   'Needs Review',
  admin:    'Admin',
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { allProjects, current, slug, isAdmin, clientSlug } = useProject()
  const { dark, toggle } = useTheme()

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )

  const screen = pathname.includes('hub') ? 'hub'
    : pathname.includes('meetings') ? 'meetings'
    : pathname.includes('admin') ? 'admin'
    : pathname.includes('review') ? 'review'
    : 'tasks'

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed)
  }, [collapsed])

  useEffect(() => {
    if (!isAdmin && clientSlug && slug !== clientSlug) {
      navigate(`/${clientSlug}/tasks`, { replace: true })
    }
  }, [isAdmin, clientSlug, slug])

  const navItems = [
    { key: 'tasks',    label: 'Tasks',          Icon: IconTasks,    path: `/${slug}/tasks` },
    { key: 'hub',      label: 'Process Hub',    Icon: IconHub,      path: `/${slug}/hub` },
    { key: 'meetings', label: 'Meeting Notes',  Icon: IconMeetings, path: `/${slug}/meetings` },
    { key: 'review',   label: 'Needs Review',   Icon: IconReview,   path: `/${slug}/review` },
    ...(isAdmin ? [{ key: 'admin', label: 'Admin', Icon: IconAdmin, path: '/admin' }] : []),
  ]

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img
            src="/ddsr-logo.png"
            alt="DDSR"
            onError={e => { e.target.style.display = 'none' }}
          />
          <span className="sidebar-logo-text">DDSR</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(({ key, label, Icon, path }) => (
            <button
              key={key}
              className={`nav-item${screen === key ? ' active' : ''}`}
              onClick={() => navigate(path)}
              title={collapsed ? label : undefined}
            >
              <Icon />
              <span className="nav-label">{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Project switcher (admin only) */}
          {isAdmin && allProjects.length > 1 && (
            <select
              className="sidebar-sel"
              value={slug || ''}
              onChange={e => navigate(`/${e.target.value}/${screen}`)}
            >
              {allProjects.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Utilities */}
          <div className="sidebar-utils">
            <button
              className="sidebar-collapse-btn"
              onClick={() => setCollapsed(c => !c)}
              title="Toggle sidebar"
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">
        <div className="main-topbar">
          <span className="main-topbar-title">
            {PAGE_TITLES[screen] || current?.name || 'Dashboard'}
          </span>

          {/* Project name + subtitle — absolute center of topbar */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
            {current?.name && (
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {current.name}
              </div>
            )}
            {current?.subtitle && (
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1, whiteSpace: 'nowrap' }}>
                {current.subtitle}
              </div>
            )}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
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
            <UserMenu />
          </div>
        </div>

        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  )
}
