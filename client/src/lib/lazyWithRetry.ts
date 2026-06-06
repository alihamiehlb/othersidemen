import { lazy, type ComponentType } from 'react'

type ModuleLoader = () => Promise<{ default: ComponentType<Record<string, never>> }>

/** Retry lazy chunk load once (stale cache after deploy). */
export function lazyWithRetry(loader: ModuleLoader, retries = 1) {
  return lazy(async () => {
    let lastError: unknown
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await loader()
      } catch (err) {
        lastError = err
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 400))
        }
      }
    }
    throw lastError
  })
}

/** Lazy route with typed props (e.g. PolicyRoute slug). */
export function lazyWithRetryProps<P extends Record<string, unknown>>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  retries = 1,
) {
  return lazy(async () => {
    let lastError: unknown
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await loader()
      } catch (err) {
        lastError = err
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 400))
        }
      }
    }
    throw lastError
  })
}
