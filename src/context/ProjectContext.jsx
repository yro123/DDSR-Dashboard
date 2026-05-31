import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [clients, setClients] = useState([])
  const { data: session } = authClient.useSession()

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers }
    if (options.body) headers['Content-Type'] = 'application/json'

    const res = await fetch(url, { ...options, headers, credentials: 'include' })

    if (!res.ok) {
      let errorMessage = `Request failed with status ${res.status}`
      try {
        const data = await res.json()
        errorMessage = data?.error || data?.message || errorMessage
      } catch {}
      const err = new Error(errorMessage)
      err.status = res.status
      throw err
    }

    const text = await res.text()
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }, [])

  // Central API helper + hooks (useQuery, useMutation, usePermissions) are the preferred patterns.
  const api = {
    get: (url) => authFetch(url),
    post: (url, body) => authFetch(url, { method: 'POST', body: JSON.stringify(body) }),
    put: (url, body) => authFetch(url, { method: 'PUT', body: JSON.stringify(body) }),
    del: (url) => authFetch(url, { method: 'DELETE' }),
  }

  useEffect(() => {
    if (session) {
      api.get('/api/clients')
        .then(data => {
          const normalized = Array.isArray(data)
            ? data.map(c => ({ ...c, projects: c.projects || [] }))
            : [];
          setClients(normalized);
        })
        .catch(() => setClients([]))
    }
  }, [session, api])

  return (
    <ProjectContext.Provider 
      value={{ 
        clients, 
        api,
        session
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const params = useParams()
  const { 
    clients, 
    authFetch, 
    api,
    session
  } = useContext(ProjectContext)
  const user = session?.user

  const myClientSlugs = clients.map(c => c.slug)
  // currentClient comes only from the clients the user actually has membership for (via user_clients on the backend).
  const currentClient = clients.find(c => c.slug === params.slug) || clients[0] || null

  const canAccessClient = (slug) => myClientSlugs.includes(slug)
  const hasMultipleClients = myClientSlugs.length > 1

  // Clean permission/scope object
  const isAdmin = !!(user?.isAdmin) || (typeof user?.email === 'string' && user.email.endsWith('@datadrivensr.com')) || false

  const currentUserScope = {
    isAdmin,
    myClientSlugs,
    hasMultipleClients,
    canAccessClient,
    currentClientSlug: currentClient?.slug || null,
  }

  const allProjects = clients.flatMap(c => (c.projects || []).map(p => ({ ...p, client: c })))
  const slug = params.slug || null
  const current = slug ? (allProjects.find(p => p.slug === slug) || null) : currentClient

  return { 
    clients, 
    allProjects, 
    current, 
    slug, 
    isAdmin, 
    api,
    session, 
    myClientSlugs, 
    currentClient,
    canAccessClient,
    hasMultipleClients,
    currentUserScope
  }
}
