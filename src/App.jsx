import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { authClient } from './lib/auth-client'
import { ProjectProvider, useProject } from './context/ProjectContext'
import { ConfigProvider } from './context/ConfigContext'
import { ThemeProvider } from './context/ThemeContext'

// Route-based code splitting: each page ships as its own chunk, loaded on demand.
const Tasks    = lazy(() => import('./pages/Tasks'))
const Hub      = lazy(() => import('./pages/Hub'))
const Meetings = lazy(() => import('./pages/Meetings'))
const Review   = lazy(() => import('./pages/Review'))
const Requests = lazy(() => import('./pages/Requests'))
const Search   = lazy(() => import('./pages/Search'))
const SignIn   = lazy(() => import('./pages/SignIn'))
const Invite   = lazy(() => import('./pages/Invite'))
const Admin    = lazy(() => import('./pages/Admin'))

function AuthGuard({ children }) {
  const { data: session, isPending } = authClient.useSession()
  if (isPending) return null
  if (!session)  return <Navigate to="/sign-in" replace />
  return children
}

function AuthenticatedApp() {
  return (
    <ProjectProvider>
      <ConfigProvider>
        <Routes>
          {/* Smart default landing: admins go to Admin panel, everyone else goes to their first accessible client */}
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/admin"           element={<Admin />} />
          <Route path="/search"          element={<Search />} />
          <Route path="/:slug/tasks"    element={<Tasks />} />
          <Route path="/:slug/hub"      element={<Hub />} />
          <Route path="/:slug/meetings" element={<Meetings />} />
          <Route path="/:slug/review"   element={<Review />} />
          <Route path="/:slug/requests" element={<Requests />} />
        </Routes>
      </ConfigProvider>
    </ProjectProvider>
  )
}

function DefaultRedirect() {
  const { clients, isAdmin, allProjects } = useProject()
  const navigate = useNavigate()

  useEffect(() => {
    if (clients.length === 0) return // still loading

    if (isAdmin) {
      navigate('/admin', { replace: true })
      return
    }
    // `:slug` routes are project-scoped, so always land on a PROJECT slug.
    // A client with no projects yet has no valid dashboard URL — fall through
    // to the empty state below instead of building a dead `/:clientSlug/tasks`.
    const target = allProjects[0]?.slug
    if (target) navigate(`/${target}/tasks`, { replace: true })
  }, [clients, isAdmin, allProjects, navigate])

  if (clients.length === 0) return null // still loading
  if (!isAdmin && allProjects.length === 0) return <NoProjects />
  return null
}

function NoProjects() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8,
      color: 'var(--text-dim)', padding: 40, textAlign: 'center',
    }}>
      <div style={{ fontSize: 28 }}>📂</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>No projects yet</div>
      <div style={{ fontSize: 13, maxWidth: 420 }}>
        Your workspace doesn’t have any projects set up yet. An administrator needs to
        create a project before there’s anything to show here.
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<div style={{ padding: 40, color: 'var(--text-dim)' }}>Loading…</div>}>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/invite"  element={<Invite />} />
          <Route path="*" element={<AuthGuard><AuthenticatedApp /></AuthGuard>} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  )
}
