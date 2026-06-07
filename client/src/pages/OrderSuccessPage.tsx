import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { StatusScreen } from '@/components/branding/StatusScreen'
import { api } from '@/lib/api'

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

interface StatusResponse {
  paymentStatus: PaymentStatus
  paymentMethod: 'cod' | 'whish' | 'whatsapp'
  paidAt: string | null
}

// Never trust the return URL — confirm payment by polling the API.
type Phase = 'checking' | 'paid' | 'failed' | 'pending_offline' | 'timeout' | 'unknown'

const POLL_INTERVAL_MS = 2000
const MAX_ATTEMPTS = 15 // ~30s

export function OrderSuccessPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')
  const [phase, setPhase] = useState<Phase>(orderId ? 'checking' : 'unknown')

  useEffect(() => {
    if (!orderId) return

    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    // `api()` never rejects (it resolves an error envelope), but guard anyway so
    // an unexpected throw can't leave the page stuck on the spinner forever.
    async function poll() {
      try {
        attempts += 1
        const res = await api<StatusResponse>(`/api/payments/${orderId}/status`)
        if (cancelled) return

        if (res.success && res.data) {
          const { paymentStatus, paymentMethod } = res.data
          // COD / WhatsApp are pay-later — never settled online, so stop polling.
          if (paymentMethod === 'cod' || paymentMethod === 'whatsapp') {
            setPhase('pending_offline')
            return
          }
          if (paymentStatus === 'paid') {
            setPhase('paid')
            return
          }
          if (paymentStatus === 'failed' || paymentStatus === 'refunded') {
            setPhase('failed')
            return
          }
        }

        // Still pending (or a transient fetch error) — retry until the cap.
        if (attempts >= MAX_ATTEMPTS) {
          setPhase('timeout')
          return
        }
        timer = setTimeout(() => void poll(), POLL_INTERVAL_MS)
      } catch {
        if (!cancelled) setPhase('timeout')
      }
    }

    void poll()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [orderId])

  const ref = orderId ? ` #${orderId.slice(-8).toUpperCase()}` : ''

  if (phase === 'checking') {
    return <LoadingScreen message="Confirming payment" />
  }

  if (phase === 'paid') {
    return (
      <StatusScreen
        variant="success"
        title="Payment confirmed"
        message={`Thank you — your order${ref} is paid and confirmed. We'll ship it shortly.`}
        primaryAction={{ label: 'Continue shopping', href: '/shop' }}
        secondaryAction={{ label: 'View account', href: '/account' }}
      />
    )
  }

  if (phase === 'failed') {
    return (
      <StatusScreen
        variant="error"
        title="Payment not completed"
        message={`We couldn't confirm payment for order${ref}. No charge was captured — you can retry from your bag.`}
        primaryAction={{ label: 'Back to bag', href: '/cart' }}
        secondaryAction={{ label: 'View account', href: '/account' }}
      />
    )
  }

  if (phase === 'pending_offline') {
    return (
      <StatusScreen
        variant="success"
        title="Order placed"
        message={`Thanks — your order${ref} is in. We'll confirm by WhatsApp or on delivery.`}
        primaryAction={{ label: 'Continue shopping', href: '/shop' }}
        secondaryAction={{ label: 'View account', href: '/account' }}
      />
    )
  }

  if (phase === 'timeout') {
    return (
      <StatusScreen
        variant="info"
        title="Still confirming"
        message={`Your order${ref} is placed and payment is still processing. We'll email you once it settles — check your account for the latest status.`}
        primaryAction={{ label: 'View account', href: '/account' }}
        secondaryAction={{ label: 'Continue shopping', href: '/shop' }}
      />
    )
  }

  // No orderId on the URL — can't verify, show a neutral confirmation.
  return (
    <StatusScreen
      variant="info"
      title="Order received"
      message="Thank you — your order is in. We'll confirm soon."
      primaryAction={{ label: 'Continue shopping', href: '/shop' }}
      secondaryAction={{ label: 'View account', href: '/account' }}
    />
  )
}
