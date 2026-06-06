import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useTheme } from '@/contexts/ThemeContext'
import { FOOTER_LINKS } from '@/data/mockData'

function FooterLink({ href, label }: { href: string; label: string }) {
  const isInternal = href.startsWith('/')
  const className = 'text-xs text-brand-muted transition-colors hover:text-brand-white'

  if (isInternal) {
    return (
      <Link to={href} className={className}>
        {label}
      </Link>
    )
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  )
}

export function Footer() {
  const { theme } = useTheme()

  return (
    <footer className="bg-brand-dark px-6 pt-20 pb-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr]">
          <div>
            <Logo className="mb-4 h-12" color={theme === 'light' ? 'black' : 'white'} />
            <p className="mb-6 max-w-xs text-xs leading-relaxed text-brand-muted">
              Two sides. One identity. Fashion designed for the modern individual who refuses to be defined by a single aesthetic.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/othersidemen" aria-label="Instagram" className="text-brand-muted transition-colors hover:text-brand-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest">{group.title}</h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest">Stay Updated</h3>
            <p className="mb-4 text-xs leading-relaxed text-brand-muted">
              Be the first to know about new drops, exclusive offers, and style inspiration.
            </p>
            <form className="flex border border-theme-subtle" onSubmit={(e) => e.preventDefault()} aria-label="Newsletter signup">
              <input
                type="email"
                placeholder="Your email"
                aria-label="Email address"
                className="flex-1 bg-transparent px-4 py-3 text-xs text-brand-white placeholder:text-brand-muted focus:outline-none"
              />
              <button type="submit" aria-label="Subscribe" className="px-4 text-brand-white transition-colors hover:text-brand-light">
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-theme-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-brand-muted">&copy; {new Date().getFullYear()} OTHER SIDE. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/privacy" className="text-[10px] text-brand-muted transition-colors hover:text-brand-white">Privacy</Link>
            <Link to="/terms" className="text-[10px] text-brand-muted transition-colors hover:text-brand-white">Terms</Link>
            <Link to="/cookies" className="text-[10px] text-brand-muted transition-colors hover:text-brand-white">Cookies</Link>
            <Link to="/security-policy" className="text-[10px] text-brand-muted transition-colors hover:text-brand-white">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
