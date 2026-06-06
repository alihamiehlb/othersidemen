import { useCallback, useEffect, useRef } from 'react'

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
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

export function useTurnstile(action: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const enabled = Boolean(SITE_KEY)

  useEffect(() => {
    if (!enabled || !containerRef.current) return
    let cancelled = false

    loadTurnstileScript()
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
        })
      })
      .catch((err) => console.warn('[turnstile]', err))

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [action, enabled])

  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (!enabled) return undefined
    await loadTurnstileScript()
    if (!widgetIdRef.current || !window.turnstile) return undefined
    const token = window.turnstile.getResponse(widgetIdRef.current)
    if (token) window.turnstile.reset(widgetIdRef.current)
    return token || undefined
  }, [enabled])

  return { containerRef, getToken, enabled }
}
