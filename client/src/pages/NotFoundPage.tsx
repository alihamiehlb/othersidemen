import { ErrorScreen } from '@/components/branding/ErrorScreen'

export function NotFoundPage() {
  return (
    <ErrorScreen
      title="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
    />
  )
}
