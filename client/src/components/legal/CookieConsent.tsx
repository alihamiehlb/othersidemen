import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

const STORAGE_KEY = 'otherside-cookie-consent'

type ConsentChoice = 'accepted' | 'declined'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentChoice | null
    if (!stored) setVisible(true)
  }, [])

  function save(choice: ConsentChoice) {
    localStorage.setItem(STORAGE_KEY, choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-4 bottom-4 z-[200] mx-auto max-w-lg rounded-xl border border-theme-subtle bg-theme-surface p-5 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-6 sm:bottom-6 sm:left-auto"
    >
      <p id="cookie-consent-title" className="text-sm font-semibold uppercase tracking-wide">
        Cookies & privacy
      </p>
      <p id="cookie-consent-desc" className="mt-2 text-sm leading-relaxed text-brand-muted">
        We use essential cookies for sign-in, cart, and security. Optional analytics may help us improve the store.
        See our{' '}
        <Link to="/cookies" className="underline underline-offset-2 hover:text-brand-white">
          Cookie Policy
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" type="button" className="w-full sm:w-auto" onClick={() => save('declined')}>
          Decline optional
        </Button>
        <Button variant="solid" type="button" className="w-full sm:w-auto" onClick={() => save('accepted')}>
          Accept all
        </Button>
      </div>
    </div>
  )
}
