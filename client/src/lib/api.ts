const API_BASE = import.meta.env.VITE_API_URL ?? ''
const REQUEST_TIMEOUT_MS = 12_000

let csrfToken: string | null = null
let csrfFetch: Promise<string> | null = null

function withTimeout(options: RequestInit = {}): RequestInit {
  if (options.signal) return options
  return { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
}

function userFacingError(status: number, serverError: string | null): string {
  if (serverError?.toLowerCase().includes('csrf')) {
    return 'Your session expired. Please try again.'
  }
  if (status === 401) return 'Please sign in to continue.'
  if (status === 403) return 'You do not have permission for this action.'
  if (status === 429) return 'Too many requests. Wait a moment and try again.'
  if (status >= 500) return 'Our servers are busy. Please try again shortly.'
  return serverError ?? 'Something went wrong. Please try again.'
}

async function fetchCsrfToken(): Promise<string> {
  if (csrfFetch) return csrfFetch
  csrfFetch = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/csrf-token`, withTimeout({ credentials: 'include' }))
      if (!res.ok) return ''
      const json = await res.json()
      csrfToken = json.data?.csrfToken ?? null
      return csrfToken ?? ''
    } finally {
      csrfFetch = null
    }
  })()
  return csrfFetch
}

export async function prefetchCsrfToken(): Promise<void> {
  await fetchCsrfToken()
}

async function getCsrfToken(force = false): Promise<string> {
  if (!force && csrfToken) return csrfToken
  return fetchCsrfToken()
}

interface ApiResult<T> {
  success: boolean
  data: T | null
  error: string | null
  meta?: Record<string, unknown>
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retries = 0,
): Promise<ApiResult<T>> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const maxAttempts = Math.max(1, retries + 1)
  let lastResult: ApiResult<T> = { success: false, data: null, error: 'Request failed' }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      headers['x-csrf-token'] = await getCsrfToken(attempt > 0)
    }

    try {
      const res = await fetch(`${API_BASE}${path}`, withTimeout({
        ...options,
        headers,
        credentials: 'include',
      }))

      const text = await res.text()
      if (!text) {
        lastResult = {
          success: false,
          data: null,
          error: userFacingError(res.status, res.ok ? 'Empty response' : null),
        }
      } else {
        const parsed = JSON.parse(text) as ApiResult<T>
        lastResult = {
          ...parsed,
          error: parsed.success ? null : userFacingError(res.status, parsed.error),
        }
      }

      if (lastResult.success) return lastResult

      const csrfRetry = !lastResult.success
        && attempt < maxAttempts - 1
        && (lastResult.error?.includes('session') || lastResult.error?.toLowerCase().includes('csrf'))
      if (csrfRetry) {
        csrfToken = null
        continue
      }

      if (attempt === maxAttempts - 1) return lastResult
    } catch {
      lastResult = {
        success: false,
        data: null,
        error: 'Unable to reach the store. Check your connection and try again.',
      }
      if (attempt === maxAttempts - 1) return lastResult
    }

    await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)))
  }

  return lastResult
}

export function clearCsrfToken(): void {
  csrfToken = null
}
