import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [clients, setClients] = useState([])
  const { data: session } = authClient.useSession()

  const authFetch = useCallback((url, options = {}) => {
    const headers = { ...options.headers }
    if (options.body) headers['Content-Type'] = 'application/json'
    return fetch(url, { ...options, headers, credentials: 'include' })
  }, [])

  useEffect(() => {
    if (session) {
      authFetch('/api/clients').then(r => r.json()).then(setClients).catch(() => {})
    }
  }, [session, authFetch])

  return (
    <ProjectContext.Provider value={{ clients, authFetch, session }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const { slug } = useParams()
  const { clients, authFetch, session } = useContext(ProjectContext)
  const user = session?.user

  const allProjects = clients.flatMap(c => c.projects.map(p => ({ ...p, client: c })))
  const current     = allProjects.find(p => p.slug === slug) || null

  const isAdmin    = !!(user?.isAdmin) || user?.email?.endsWith('@datadrivensr.com') || false
  const clientSlug = user?.clientSlug ?? null

  return { clients, allProjects, current, slug, isAdmin, clientSlug, authFetch, session }
}
