import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Images,
  Store,
  LogOut,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/photos', label: 'Photos', icon: Images },
  { to: '/admin/users', label: 'Users', icon: Users },
]

export function AdminSidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="flex w-full flex-col border-b border-theme-border bg-brand-dark lg:fixed lg:inset-y-0 lg:w-64 lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-3 border-b border-theme-border px-5 py-4">
        <Link to="/admin" className="flex items-center gap-3">
          <Logo className="h-9 w-[72px]" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-muted">Admin</span>
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-6">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }: { isActive: boolean }) =>
              `flex shrink-0 items-center gap-3 rounded px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                isActive
                  ? 'bg-brand-white text-brand-black'
                  : 'text-brand-muted hover:bg-brand-gray hover:text-brand-white'
              }`
            }
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto hidden border-t border-theme-border p-4 lg:block">
        <p className="truncate text-xs font-medium">{user?.name}</p>
        <p className="truncate text-[10px] text-brand-muted">{user?.email}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-muted hover:text-brand-white"
          >
            <Store size={14} />
            View store
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-muted hover:text-brand-white"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
