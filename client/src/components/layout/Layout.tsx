import { Outlet, useLocation, useNavigation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { ApiStatusBanner } from './ApiStatusBanner'
import { CookieConsent } from '@/components/legal/CookieConsent'
import { LoadingScreen } from '@/components/branding/LoadingScreen'

export function Layout() {
  const navigation = useNavigation()
  const location = useLocation()
  const [routeSplash, setRouteSplash] = useState(true)
  const isNavigating = navigation.state === 'loading'

  useEffect(() => {
    setRouteSplash(true)
    const timer = setTimeout(() => setRouteSplash(false), 750)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const showLoader = isNavigating || routeSplash

  return (
    <>
      <ApiStatusBanner />
      <Header />
      {showLoader && <LoadingScreen />}
      <main className={showLoader ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
    </>
  )
}
