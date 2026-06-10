/** Shape of the lightweight API client provided by ProjectContext. */
export interface ApiClient {
  get: <T = unknown>(path: string) => Promise<T>
  post: <T = unknown>(path: string, body?: unknown) => Promise<T>
  put: <T = unknown>(path: string, body?: unknown) => Promise<T>
  del: <T = unknown>(path: string) => Promise<T>
}
