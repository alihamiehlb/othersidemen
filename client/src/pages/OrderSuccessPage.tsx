import { useSearchParams } from 'react-router-dom'
import { StatusScreen } from '@/components/branding/StatusScreen'

export function OrderSuccessPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')

  return (
    <StatusScreen
      variant="success"
      title="Order confirmed"
      message={
        orderId
          ? `Thank you — your order is in. Reference #${orderId.slice(-8).toUpperCase()}. We'll confirm by WhatsApp or email soon.`
          : "Thank you — your order is in. We'll confirm soon."
      }
      primaryAction={{ label: 'Continue shopping', href: '/shop' }}
      secondaryAction={{ label: 'View account', href: '/account' }}
    />
  )
}
