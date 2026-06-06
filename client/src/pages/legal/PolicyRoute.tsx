import { Navigate } from 'react-router-dom'
import { PolicyPage } from './PolicyPage'
import { POLICIES } from './policies'

interface PolicyRouteProps {
  slug: keyof typeof POLICIES
}

export function PolicyRoute({ slug }: PolicyRouteProps) {
  const doc = POLICIES[slug]
  if (!doc) return <Navigate to="/" replace />
  return <PolicyPage doc={doc} />
}
