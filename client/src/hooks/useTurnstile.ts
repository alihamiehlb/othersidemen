import { useCallback, useEffect, useRef } from 'react'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

declare global {
  interface Window {
    turnstile?: {
      ready: (callback: () => void) => void
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      execute: (widgetId: string) => void
      getResponse: (widgetId: string) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    window.onTurnstileLoad = () => resolve()
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad'
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Turnstile script failed to load'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

function waitForTurnstileReady(): Promise<void> {
  return new Promise((resolve) => {
    if (window.turnstile?.ready) {
      window.turnstile.ready(() => resolve())
      return
    }
    resolve()
  })
}

export function useTurnstile(action: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const pendingRef = useRef<{
    resolve: (token: string) => void
    reject: (err: Error) => void
  } | null>(null)
  const enabled = Boolean(SITE_KEY)

  useEffect(() => {
    if (!enabled || !containerRef.current) return
    let cancelled = false

    loadTurnstileScript()
      .then(() => waitForTurnstileReady())
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action,
          size: 'invisible',
          execution: 'execute',
          callback: (token: string) => {
            pendingRef.current?.resolve(token)
            pendingRef.current = null
          },
          'error-callback': () => {
            pendingRef.current?.reject(new Error('Captcha verification failed'))
            pendingRef.current = null
          },
          'expired-callback': () => {
            pendingRef.current?.reject(new Error('Captcha expired — try again'))
            pendingRef.current = null
          },
        })
      })
      .catch((err) => console.warn('[turnstile]', err))

    return () => {
      cancelled = true
      pendingRef.current?.reject(new Error('Captcha cancelled'))
      pendingRef.current = null
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [action, enabled])

  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (!enabled) return undefined
    await loadTurnstileScript()
    await waitForTurnstileReady()
    if (!widgetIdRef.current || !window.turnstile) {
      throw new Error('Captcha is not ready — refresh and try again')
    }

    const existing = window.turnstile.getResponse(widgetIdRef.current)
    if (existing) {
      window.turnstile.reset(widgetIdRef.current)
      return existing
    }

    return new Promise<string>((resolve, reject) => {
      pendingRef.current = { resolve, reject }
      window.turnstile!.execute(widgetIdRef.current!)
    })
  }, [enabled])

  return { containerRef, getToken, enabled }
}
