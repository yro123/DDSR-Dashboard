import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, RedirectToSignIn } from '@clerk/react'
import { ProjectProvider } from './context/ProjectContext'
import { ThemeProvider } from './context/ThemeContext'
import Tasks    from './pages/Tasks'
import Hub      from './pages/Hub'
import Meetings from './pages/Meetings'
import Review   from './pages/Review'
import SignIn   from './pages/SignIn'
import Admin    from './pages/Admin'

function AuthGuard({ children }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return null
  if (!isSignedIn) return <RedirectToSignIn />
  return children
}

function AuthenticatedApp() {
  return (
    <ProjectProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/hinckley/tasks" replace />} />
        <Route path="/admin"           element={<Admin />} />
        <Route path="/:slug/tasks"    element={<Tasks />} />
        <Route path="/:slug/hub"      element={<Hub />} />
        <Route path="/:slug/meetings" element={<Meetings />} />
        <Route path="/:slug/review"   element={<Review />} />
      </Routes>
    </ProjectProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="*" element={<AuthGuard><AuthenticatedApp /></AuthGuard>} />
      </Routes>
    </ThemeProvider>
  )
}
