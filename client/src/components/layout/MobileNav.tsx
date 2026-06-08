import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { NAV_LINKS } from '@/data/mockData'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { theme } = useTheme()
  const logoColor = theme === 'light' ? 'black' : 'white'

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  const menu = open
    ? createPortal(
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="mobile-nav-overlay fixed inset-0 z-[100]"
            onClick={close}
          />
          <nav
            className="mobile-nav-panel fixed inset-y-0 right-0 z-[110] flex w-[min(100vw-3rem,320px)] flex-col border-l border-theme-border safe-top safe-bottom"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between border-b border-theme-border px-5 py-4">
              <Logo className="h-10 w-[80px]" color={logoColor} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="mobile-nav-icon-btn touch-target inline-flex items-center justify-center rounded-full"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={close}
                  className="mobile-nav-link rounded-xl px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.18em]"
                >
                  {link.label}
                </a>
              ))}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={close}
                  className="mobile-nav-link rounded-xl px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.18em]"
                >
                  Admin
                </Link>
              )}
            </div>

            <div className="space-y-2.5 border-t border-theme-border px-4 py-5">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    onClick={close}
                    className="mobile-nav-btn-outline block rounded-xl px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={close}
                    className="mobile-nav-btn-solid block rounded-xl px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <Link
                  to="/account"
                  onClick={close}
                  className="mobile-nav-btn-outline block rounded-xl px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest"
                >
                  My Account
                </Link>
              )}
              <Link
                to="/cart"
                onClick={close}
                className="mobile-nav-btn-muted block rounded-xl px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest"
              >
                View Bag
              </Link>
            </div>
          </nav>
        </>,
        document.body,
      )
    : null

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mobile-nav-icon-btn touch-target inline-flex items-center justify-center rounded-full"
      >
        {open ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
      </button>
      {menu}
    </div>
  )
}
