import { Link } from 'react-router-dom'
import { Search, ShoppingBag, User } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { NAV_LINKS } from '@/data/mockData'

export function Header() {
  const { user } = useAuth()
  const { itemCount } = useCart()

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-theme-border bg-theme-surface backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between pl-4 pr-5 sm:pl-5 sm:pr-6 lg:pl-8 lg:pr-10">
        <Link to="/" className="flex shrink-0 items-center" aria-label="OTHER SIDE home">
          <Logo className="h-11 w-[88px] sm:h-12 sm:w-[96px] lg:h-[52px] lg:w-[104px]" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[10px] font-medium tracking-widest text-brand-white/80 transition-colors hover:text-brand-white"
            >
              {link.label}
            </a>
          ))}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="text-[10px] font-medium tracking-widest text-brand-white/80 transition-colors hover:text-brand-white"
            >
              ADMIN
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <button type="button" aria-label="Search" className="hidden text-brand-white/80 transition-colors hover:text-brand-white sm:block">
            <Search size={18} strokeWidth={1.5} />
          </button>

          {!user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className="rounded border border-theme-subtle px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-brand-white transition-colors hover:bg-brand-white hover:text-brand-black"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="rounded bg-brand-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-brand-light"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <Link
              to="/account"
              aria-label="My account"
              className="text-brand-white/80 transition-colors hover:text-brand-white"
            >
              <User size={18} strokeWidth={1.5} />
            </Link>
          )}

          {!user && (
            <Link
              to="/login"
              aria-label="Sign in"
              className="text-brand-white/80 transition-colors hover:text-brand-white sm:hidden"
            >
              <User size={18} strokeWidth={1.5} />
            </Link>
          )}

          <Link
            to="/cart"
            aria-label={`Shopping bag, ${itemCount} items`}
            className="flex items-center gap-1 text-brand-white/80 transition-colors hover:text-brand-white"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">({itemCount})</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
