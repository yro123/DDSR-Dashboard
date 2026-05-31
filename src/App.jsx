import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { authClient } from './lib/auth-client'
import { ProjectProvider, useProject } from './context/ProjectContext'
import { ConfigProvider } from './context/ConfigContext'
import { ThemeProvider } from './context/ThemeContext'
import Tasks    from './pages/Tasks'
import Hub      from './pages/Hub'
import Meetings from './pages/Meetings'
import Review   from './pages/Review'
import Requests from './pages/Requests'
import Search   from './pages/Search'
import SignIn   from './pages/SignIn'
import Invite   from './pages/Invite'
import Admin    from './pages/Admin'

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
  const { clients, isAdmin, currentClient, allProjects } = useProject()
  const navigate = useNavigate()

  useEffect(() => {
    if (clients.length === 0) return // still loading

    if (isAdmin) {
      navigate('/admin', { replace: true })
    } else {
      // Land regular users on their current (or first) accessible client
      const target = currentClient?.slug || allProjects[0]?.slug || clients[0]?.slug
      if (target) {
        navigate(`/${target}/tasks`, { replace: true })
      } else {
        navigate('/admin', { replace: true })
      }
    }
  }, [clients, isAdmin, currentClient, allProjects, navigate])

  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/invite"  element={<Invite />} />
        <Route path="*" element={<AuthGuard><AuthenticatedApp /></AuthGuard>} />
      </Routes>
    </ThemeProvider>
  )
}
