import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/react'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [clients, setClients] = useState([])
  const { getToken } = useAuth()

  const authFetch = useCallback(async (url, options = {}) => {
    const token = await getToken()
    const headers = { ...options.headers }
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (options.body) headers['Content-Type'] = 'application/json'
    return fetch(url, { ...options, headers })
  }, [getToken])

  useEffect(() => {
    authFetch('/api/clients').then(r => r.json()).then(setClients)
  }, [authFetch])

  return (
    <ProjectContext.Provider value={{ clients, authFetch }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const { slug } = useParams()
  const { clients, authFetch } = useContext(ProjectContext)
  const { user } = useUser()

  const allProjects = clients.flatMap(c => c.projects.map(p => ({ ...p, client: c })))
  const current = allProjects.find(p => p.slug === slug) || null

  const isAdmin = user?.primaryEmailAddress?.emailAddress?.endsWith('@datadrivensr.com') ?? false
  const clientSlug = user?.publicMetadata?.clientSlug ?? null

  return { clients, allProjects, current, slug, isAdmin, clientSlug, authFetch }
}
