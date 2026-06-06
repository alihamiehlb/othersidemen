import { ErrorScreen } from '@/components/branding/ErrorScreen'
import { SeoHead } from '@/components/seo/SeoHead'

export function NotFoundPage() {
  return (
    <>
      <SeoHead title="Page Not Found" noindex canonicalPath="/404" />
      <ErrorScreen
        title="Page not found"
        message="The page you're looking for doesn't exist or has been moved."
      />
    </>
  )
}