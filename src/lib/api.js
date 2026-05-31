/**
 * @deprecated
 * This file is kept only for backward compatibility during migration.
 *
 * Preferred approach (item #3 completed):
 *   import { useProject } from '../context/ProjectContext'
 *   import { useQuery, useMutation, useApi } from '../hooks/useApi'
 *
 *   const { api, authFetch } = useProject()
 *   const { data, loading, refetch } = useQuery(() => api.get(`/api/tasks?slug=${slug}`), [slug])
 *
 *   const { mutate, loading: saving } = useMutation((body) => api.post('/api/tasks', body))
 */
import { authClient } from './auth-client'

export { authClient }

// Legacy thin wrappers — new code should use the context + hooks above
export async function apiFetch(path, options = {}) {
  // During transition, delegate to fetch directly (same behavior as before)
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(path, { credentials: 'include', ...options, headers })
  if (!res.ok) {
    let message = `Request failed with ${res.status}`
    try { const d = await res.json(); message = d?.error || d?.message || message } catch {}
    const err = new Error(message); err.status = res.status; throw err
  }
  const text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return text }
}

export const api = {
  get: (p) => apiFetch(p),
  post: (p, b) => apiFetch(p, { method: 'POST', body: JSON.stringify(b) }),
  put: (p, b) => apiFetch(p, { method: 'PUT', body: JSON.stringify(b) }),
  del: (p) => apiFetch(p, { method: 'DELETE' }),
}

