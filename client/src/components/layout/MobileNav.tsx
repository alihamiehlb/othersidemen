import { useEffect, useState } from 'react'
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
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="touch-target inline-flex items-center justify-center rounded-full border border-theme-subtle text-brand-white/90 transition-colors hover:text-brand-white"
      >
        {open ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <nav
            className="mobile-nav-panel fixed inset-y-0 right-0 z-[70] flex w-[min(100vw,320px)] flex-col border-l border-theme-border bg-brand-black/95 backdrop-blur-xl"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between border-b border-theme-border px-5 py-4">
              <Logo className="h-10 w-[80px]" color={logoColor} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="touch-target inline-flex items-center justify-center rounded-full border border-theme-subtle"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="mobile-nav-link rounded-2xl px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-brand-white transition-colors hover:bg-brand-gray"
                >
                  {link.label}
                </a>
              ))}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="mobile-nav-link rounded-2xl px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-brand-white transition-colors hover:bg-brand-gray"
                >
                  Admin
                </Link>
              )}
            </div>

            <div className="space-y-3 border-t border-theme-border px-4 py-5 safe-bottom">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl border border-theme-subtle px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl bg-brand-white px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest text-brand-black"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl border border-theme-subtle px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest"
                >
                  My Account
                </Link>
              )}
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="block rounded-2xl bg-brand-gray px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-widest"
              >
                View Bag
              </Link>
            </div>
          </nav>
        </>
      )}
    </div>
  )
}
