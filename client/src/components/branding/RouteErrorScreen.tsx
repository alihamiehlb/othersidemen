import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ErrorScreen } from '@/components/branding/ErrorScreen'

function messageFromError(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return 'This page could not be found.'
    return error.statusText || 'Something went wrong loading this page.'
  }
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch dynamically imported module')) {
      return 'A new version of the site is available. Refresh to continue.'
    }
    return error.message
  }
  return "We couldn't load this page. Please try again."
}

export function RouteErrorScreen() {
  const error = useRouteError()

  return (
    <ErrorScreen
      title="Page unavailable"
      message={messageFromError(error)}
      onRetry={() => window.location.reload()}
    />
  )
}
