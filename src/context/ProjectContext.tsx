import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { authClient } from '../lib/auth-client'
import type { ApiClient } from '../lib/apiTypes'
import type { ClientWithProjects, ProjectSummary, SessionUser } from '../../shared/types'

/** A project enriched with its owning client (as exposed via `allProjects`). */
export type ProjectWithClient = ProjectSummary & { client: ClientWithProjects }

type AuthFetch = <T = unknown>(url: string, options?: RequestInit) => Promise<T>

interface ProviderValue {
  clients: ClientWithProjects[]
  api: ApiClient
  authFetch: AuthFetch
  session: { user?: SessionUser } | null
}

export interface CurrentUserScope {
  isAdmin: boolean
  myClientSlugs: string[]
  hasMultipleClients: boolean
  canAccessClient: (slug: string) => boolean
  currentClientSlug: string | null
}

export interface ProjectContextValue extends ProviderValue {
  allProjects: ProjectWithClient[]
  current: ProjectWithClient | null
  slug: string | null
  isAdmin: boolean
  myClientSlugs: string[]
  currentClient: ClientWithProjects | null
  canAccessClient: (slug: string) => boolean
  hasMultipleClients: boolean
  currentUserScope: CurrentUserScope
}

const ProjectContext = createContext<ProviderValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientWithProjects[]>([])
  const { data: session } = authClient.useSession()

  const authFetch = useCallback<AuthFetch>(async (url, options = {}) => {
    const headers: Record<string, string> = { ...(options.headers as Record<string, string>) }
    if (options.body) headers['Content-Type'] = 'application/json'

    const res = await fetch(url, { ...options, headers, credentials: 'include' })

    if (!res.ok) {
      let errorMessage = `Request failed with status ${res.status}`
      try {
        const data = await res.json()
        errorMessage = data?.error || data?.message || errorMessage
      } catch {
        /* ignore */
      }
      const err = new Error(errorMessage) as Error & { status?: number }
      err.status = res.status
      throw err
    }

    const text = await res.text()
    if (!text) return null as never
    try {
      return JSON.parse(text)
    } catch {
      return text as never
    }
  }, [])

  // Central API helper + hooks (useQuery, useMutation, usePermissions) are the preferred patterns.
  const api = useMemo<ApiClient>(() => ({
    get: (url) => authFetch(url),
    post: (url, body) => authFetch(url, { method: 'POST', body: JSON.stringify(body) }),
    put: (url, body) => authFetch(url, { method: 'PUT', body: JSON.stringify(body) }),
    del: (url) => authFetch(url, { method: 'DELETE' }),
  }), [authFetch])

  useEffect(() => {
    if (session) {
      api.get<ClientWithProjects[]>('/api/clients')
        .then((data) => {
          const normalized = Array.isArray(data)
            ? data.map((c) => ({ ...c, projects: c.projects || [] }))
            : []
          setClients(normalized)
        })
        .catch(() => setClients([]))
    }
  }, [session, api])

  return (
    <ProjectContext.Provider
      value={{
        clients,
        api,
        authFetch,
        session: (session as { user?: SessionUser } | null) ?? null,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject(): ProjectContextValue {
  const params = useParams()
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  const { clients, authFetch, api, session } = ctx
  const user = session?.user

  const myClientSlugs = clients.map((c) => c.slug)

  const canAccessClient = (slug: string) => myClientSlugs.includes(slug as never)
  const hasMultipleClients = myClientSlugs.length > 1

  // Admin is the explicit flag only — mirrors the backend `isAdmin()` (the old
  // @datadrivensr.com email rule was removed to prevent signup self-escalation).
  const isAdmin = !!user?.isAdmin

  // The `:slug` route param is always a PROJECT slug. `current` is that project;
  // `currentClient` is the project's owning client. When there's no project slug
  // in the URL (e.g. the /admin route), fall back to the first available project.
  const allProjects: ProjectWithClient[] = useMemo(
    () => clients.flatMap((c) => (c.projects || []).map((p) => ({ ...p, client: c }))),
    [clients],
  )
  const slug = params.slug || null
  const current: ProjectWithClient | null = useMemo(
    () => (slug ? allProjects.find((p) => p.slug === slug) || null : allProjects[0] || null),
    [allProjects, slug],
  )
  const currentClient: ClientWithProjects | null = current?.client || clients[0] || null

  const currentUserScope: CurrentUserScope = {
    isAdmin,
    myClientSlugs,
    hasMultipleClients,
    canAccessClient,
    currentClientSlug: currentClient?.slug || null,
  }

  return {
    clients,
    allProjects,
    current,
    slug,
    isAdmin,
    api,
    authFetch,
    session,
    myClientSlugs,
    currentClient,
    canAccessClient,
    hasMultipleClients,
    currentUserScope,
  }
}
