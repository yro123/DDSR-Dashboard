import { useState, useEffect, useCallback } from 'react'
import { useProject } from '../context/ProjectContext'

/**
 * Lightweight data fetching hook for GET requests.
 * Reduces raw authFetch + useEffect + loading/error boilerplate.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useQuery(
 *     () => api.get(`/api/tasks?slug=${slug}`),
 *     [slug]
 *   )
 */
export function useQuery(fetcher, deps = []) {
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(undefined)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
      return result
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refetch, setData }
}

/**
 * Lightweight mutation hook for POST/PUT/DELETE.
 *
 * Usage:
 *   const { mutate, loading, error } = useMutation(
 *     (payload) => api.post('/api/tasks', payload)
 *   )
 */
export function useMutation(mutateFn) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(undefined)

  const mutate = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutateFn(...args)
      return result
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [mutateFn])

  return { mutate, loading, error }
}

/**
 * Convenience: returns the current api + authFetch from context.
 * Use when you don't need the full hook state management.
 */
export function useApi() {
  const { api, authFetch } = useProject()
  return { api, authFetch }
}
