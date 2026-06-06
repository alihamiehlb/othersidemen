import { useSearchParams } from 'react-router-dom'
import { StatusScreen } from '@/components/branding/StatusScreen'

export function OrderFailedPage() {
  const [params] = useSearchParams()
  const reason = params.get('reason')

  return (
    <StatusScreen
      variant="error"
      title="Order not completed"
      message={reason ?? 'Something went wrong during checkout. Your bag is still saved — please try again.'}
      primaryAction={{ label: 'Back to bag', href: '/cart' }}
      secondaryAction={{ label: 'Shop collection', href: '/shop' }}
    />
  )
}
