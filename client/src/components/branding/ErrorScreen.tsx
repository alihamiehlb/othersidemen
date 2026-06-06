import { AnimatedLogo } from '@/components/branding/AnimatedLogo'
import { Button } from '@/components/ui/Button'

interface ErrorScreenProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorScreen({
  title = 'Something went wrong',
  message = "We couldn't load this page. Please try again.",
  onRetry,
}: ErrorScreenProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <AnimatedLogo size="sm" className="mb-8 opacity-60" />
      <h1 className="mb-3 text-xl font-black uppercase tracking-tight">{title}</h1>
      <p className="mb-8 max-w-sm text-sm text-brand-muted">{message}</p>
      <div className="flex gap-4">
        {onRetry && <Button variant="solid" onClick={onRetry}>Try Again</Button>}
        <Button variant="outline" onClick={() => { window.location.href = '/' }}>Go Home</Button>
      </div>
    </div>
  )
}
