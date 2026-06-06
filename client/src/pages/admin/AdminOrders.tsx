import { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { api } from '@/lib/api'

interface OrderItem {
  name: string
  price: number
  quantity: number
  size: string
  color: string
}

interface ShippingAddress {
  fullName: string
  line1: string
  city: string
  country: string
  postalCode: string
  phone?: string
}

interface OrderRow {
  _id: string
  total: number
  subtotal: number
  shipping: number
  status: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  userId?: { name: string; email: string }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-400',
  paid: 'text-sky-400',
  shipped: 'text-violet-400',
  delivered: 'text-green-400',
  cancelled: 'text-red-400',
}

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<OrderRow | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (statusFilter) params.set('status', statusFilter)
    api<OrderRow[]>(`/api/admin/orders?${params}`).then((res) => {
      if (res.success && res.data) setOrders(res.data)
      setTotal(Number(res.meta?.total ?? 0))
      setLoading(false)
    })
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: string) {
    const res = await api(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    if (res.success) {
      load()
      if (expandedId === id && detail) setDetail({ ...detail, status })
    } else {
      alert(res.error ?? 'Update failed')
    }
  }

  async function deleteOrder(id: string) {
    if (!window.confirm('Delete this order permanently?')) return
    const res = await api(`/api/admin/orders/${id}`, { method: 'DELETE' })
    if (res.success) {
      if (expandedId === id) {
        setExpandedId(null)
        setDetail(null)
      }
      load()
    } else {
      alert(res.error ?? 'Delete failed')
    }
  }

  async function toggleDetail(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      setDetail(null)
      return
    }
    setExpandedId(id)
    const res = await api<OrderRow>(`/api/admin/orders/${id}`)
    if (res.success && res.data) setDetail(res.data)
  }

  if (loading && orders.length === 0) return <LoadingScreen message="Loading orders" />

  return (
    <div className="page-enter px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Orders"
        description={`${total} orders · update status, view shipping, delete`}
        actions={
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="admin-field border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        }
      />

      {orders.length === 0 ? (
        <p className="text-sm text-theme-secondary">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className="overflow-hidden rounded border border-theme-subtle">
              <div className="flex flex-col gap-4 bg-brand-dark/30 p-4 sm:flex-row sm:flex-wrap sm:items-center">
                <button type="button" onClick={() => toggleDetail(o._id)} className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold">{o.userId?.name ?? 'Unknown customer'}</p>
                  <p className="text-xs text-theme-secondary">{o.userId?.email ?? 'No email'}</p>
                  <p className="mt-1 text-[10px] text-theme-secondary">
                    {new Date(o.createdAt).toLocaleString()} · {o.paymentMethod}
                  </p>
                </button>
                <p className="text-lg font-bold tabular-nums">${o.total.toFixed(2)}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${STATUS_COLORS[o.status] ?? 'text-theme-secondary'}`}>
                  {o.status}
                </span>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o._id, e.target.value)}
                  className="admin-field w-full border border-theme-subtle bg-theme-input-bg px-3 py-2 text-xs uppercase sm:w-auto"
                >
                  {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDetail(o._id)}
                    className="text-[10px] uppercase tracking-widest text-theme-secondary hover:text-brand-white"
                  >
                    {expandedId === o._id ? 'Hide' : 'Details'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteOrder(o._id)}
                    className="text-[10px] uppercase tracking-widest text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expandedId === o._id && detail?._id === o._id && (
                <div className="grid gap-6 border-t border-theme-border p-4 md:grid-cols-2">
                  <div>
                    <p className="mb-3 text-[10px] uppercase tracking-widest text-theme-secondary">Line items</p>
                    <ul className="space-y-2">
                      {detail.items.map((item, i) => (
                        <li key={i} className="flex justify-between gap-4 border-b border-theme-border pb-2 text-sm">
                          <span>{item.name} · {item.size} · {item.color} × {item.quantity}</span>
                          <span className="tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-theme-secondary tabular-nums">
                      Subtotal ${detail.subtotal.toFixed(2)} · Shipping ${detail.shipping.toFixed(2)} · Payment {detail.paymentStatus}
                    </p>
                  </div>
                  <div>
                    <p className="mb-3 text-[10px] uppercase tracking-widest text-theme-secondary">Ship to</p>
                    <address className="not-italic text-sm leading-relaxed">
                      <p>{detail.shippingAddress.fullName}</p>
                      <p className="text-theme-secondary">{detail.shippingAddress.line1}</p>
                      <p className="text-theme-secondary">
                        {detail.shippingAddress.city}, {detail.shippingAddress.country} {detail.shippingAddress.postalCode}
                      </p>
                      {detail.shippingAddress.phone && (
                        <p className="mt-1 text-theme-secondary">{detail.shippingAddress.phone}</p>
                      )}
                    </address>
                    <p className="mt-4 text-[10px] text-theme-secondary">Order ID: {detail._id}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AdminPagination page={page} total={total} limit={20} onPageChange={setPage} />
    </div>
  )
}
