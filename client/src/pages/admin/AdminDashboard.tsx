import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { ErrorScreen } from '@/components/branding/ErrorScreen'
import { api } from '@/lib/api'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalProducts: number
  totalOrders: number
  revenue: number
  recentOrders: number
  newUsers: number
}

interface OrderPreview {
  _id: string
  total: number
  status: string
  createdAt: string
  userId?: { name: string; email: string }
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      api<Stats>('/api/admin/stats'),
      api<OrderPreview[]>('/api/admin/orders?page=1'),
    ])
      .then(([statsRes, ordersRes]) => {
        if (statsRes.success && statsRes.data) setStats(statsRes.data)
        else setError(true)
        if (ordersRes.success && ordersRes.data) setRecentOrders(ordersRes.data.slice(0, 5))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen message="Loading dashboard" />
  if (error || !stats) return <ErrorScreen title="Dashboard unavailable" onRetry={() => window.location.reload()} />

  const quickLinks = [
    { to: '/admin/orders', label: 'Manage orders' },
    { to: '/admin/products', label: 'Edit products & prices' },
    { to: '/admin/photos', label: 'Browse catalog photos' },
    { to: '/admin/users', label: 'Manage users' },
  ]

  return (
    <div className="px-6 py-10 lg:px-10">
      <AdminPageHeader
        title="Dashboard"
        description="Store overview · users, products, orders, revenue"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <AdminStatCard label="Total users" value={stats.totalUsers} hint={`${stats.activeUsers} active`} />
        <AdminStatCard label="Products live" value={stats.totalProducts} />
        <AdminStatCard label="Total orders" value={stats.totalOrders} hint={`${stats.recentOrders} last 30 days`} />
        <AdminStatCard label="Revenue" value={`$${stats.revenue.toFixed(2)}`} hint="Paid / shipped / delivered" />
        <AdminStatCard label="New users (30d)" value={stats.newUsers} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest">Quick links</h2>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="flex items-center justify-between rounded border border-theme-subtle px-4 py-3 text-sm transition-colors hover:bg-brand-dark/60"
                >
                  {link.label}
                  <ArrowRight size={14} className="text-brand-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest">Recent orders</h2>
            <Link to="/admin/orders" className="text-[10px] uppercase tracking-widest text-brand-muted hover:text-brand-white">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-brand-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-theme-border rounded border border-theme-subtle">
              {recentOrders.map((o) => (
                <li key={o._id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{o.userId?.name ?? 'Customer'}</p>
                    <p className="text-[10px] text-brand-muted capitalize">{o.status} · {new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums">${o.total.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
