import { Suspense } from 'react'
import { LoadingScreen } from './LoadingScreen'

export function PageLoader({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
}
