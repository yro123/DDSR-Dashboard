import { useState, useEffect, useCallback } from 'react'
import { useProject } from '../context/ProjectContext'
import { showToast } from '../components/Toast'

export interface QueryResult<T> {
  data: T | undefined
  loading: boolean
  error: unknown
  refetch: () => Promise<T>
  setData: React.Dispatch<React.SetStateAction<T | undefined>>
}

/**
 * Lightweight data fetching hook for GET requests.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useQuery(
 *     () => api.get(`/api/tasks?slug=${slug}`), [slug])
 */
export function useQuery<T = unknown>(fetcher: () => Promise<T>, deps: React.DependencyList = []): QueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(undefined)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
      return result
    } catch (e) {
      setError(e)
      // Surface load failures instead of silently showing an empty UI.
      showToast(e instanceof Error ? e.message : 'Failed to load data', 'error')
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

export interface MutationResult<TArgs extends unknown[], TResult> {
  mutate: (...args: TArgs) => Promise<TResult>
  loading: boolean
  error: unknown
}

/**
 * Lightweight mutation hook for POST/PUT/DELETE.
 */
export function useMutation<TArgs extends unknown[] = unknown[], TResult = unknown>(
  mutateFn: (...args: TArgs) => Promise<TResult>,
): MutationResult<TArgs, TResult> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(undefined)

  const mutate = useCallback(async (...args: TArgs) => {
    setLoading(true)
    setError(null)
    try {
      return await mutateFn(...args)
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [mutateFn])

  return { mutate, loading, error }
}

/** Convenience: returns the current api + authFetch from context. */
export function useApi() {
  const { api, authFetch } = useProject()
  return { api, authFetch }
}
