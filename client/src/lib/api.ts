const API_BASE = import.meta.env.VITE_API_URL ?? ''
const REQUEST_TIMEOUT_MS = 12_000

let csrfToken: string | null = null

function withTimeout(options: RequestInit = {}): RequestInit {
  if (options.signal) return options
  return { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken
  const res = await fetch(`${API_BASE}/api/csrf-token`, withTimeout({ credentials: 'include' }))
  if (!res.ok) return ''
  const json = await res.json()
  csrfToken = json.data?.csrfToken ?? null
  return csrfToken ?? ''
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

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['x-csrf-token'] = await getCsrfToken()
  }

  const maxAttempts = Math.max(1, retries + 1)
  let lastResult: ApiResult<T> = { success: false, data: null, error: 'Request failed' }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
          error: res.ok ? 'Empty response' : `Request failed (${res.status})`,
        }
      } else {
        lastResult = JSON.parse(text) as ApiResult<T>
      }

      if (lastResult.success || attempt === maxAttempts - 1) return lastResult
    } catch {
      lastResult = {
        success: false,
        data: null,
        error: 'Unable to reach server. Run npm run dev (not dev:client alone).',
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
