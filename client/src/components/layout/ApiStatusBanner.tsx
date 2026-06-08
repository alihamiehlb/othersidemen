import { useEffect, useState } from 'react'

interface HealthServices {
  mongodb?: string
  redis?: string
}

export function ApiStatusBanner() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const res = await fetch('/api/health', { credentials: 'include' })
        const json = await res.json()
        const services = json.data?.services as HealthServices | undefined

        if (cancelled) return

        if (!res.ok || json.data?.status === 'degraded') {
          if (services?.mongodb !== 'connected') {
            setMessage('Database reconnecting — please wait a moment and refresh.')
            return
          }
          setMessage('Store is temporarily unavailable. Please try again shortly.')
          return
        }

        setMessage(null)
      } catch {
        if (!cancelled) setMessage('Store is temporarily offline. Please try again in a moment.')
      }
    }

    check()
    const id = setInterval(check, 20000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (!message) return null

  return (
    <div className="bg-red-900/90 px-4 py-2 text-center text-xs text-white">
      {message}
    </div>
  )
}
