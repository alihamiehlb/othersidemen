import { useCallback, useEffect, useState } from 'react'

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim()

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

export function useRecaptcha(action: string) {
  const [ready, setReady] = useState(!SITE_KEY)

  useEffect(() => {
    if (!SITE_KEY || window.grecaptcha) {
      setReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    script.async = true
    script.onload = () => setReady(true)
    document.head.appendChild(script)
  }, [])

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!SITE_KEY) return null
    if (!window.grecaptcha) return null

    return new Promise((resolve) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(SITE_KEY, { action })
          resolve(token)
        } catch {
          resolve(null)
        }
      })
    })
  }, [action])

  return { enabled: Boolean(SITE_KEY), ready, getToken }
}
