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
          const parts: string[] = []
          if (services?.mongodb !== 'connected') parts.push('Database offline')
          if (services?.redis === 'error') parts.push('Redis error')
          setMessage(parts.length ? parts.join(' · ') : 'API degraded — run npm run dev:fresh')
          return
        }

        setMessage(null)
      } catch {
        if (!cancelled) setMessage('API server offline — run npm run dev:fresh')
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
