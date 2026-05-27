import { Routes, Route, Navigate } from 'react-router-dom'
import { authClient } from './lib/auth-client'
import { ProjectProvider } from './context/ProjectContext'
import { ConfigProvider } from './context/ConfigContext'
import { ThemeProvider } from './context/ThemeContext'
import Tasks    from './pages/Tasks'
import Hub      from './pages/Hub'
import Meetings from './pages/Meetings'
import Review   from './pages/Review'
import Requests from './pages/Requests'
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
          <Route path="/" element={<Navigate to="/hinckley/tasks" replace />} />
          <Route path="/admin"           element={<Admin />} />
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
