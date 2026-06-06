import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { StatusScreen } from '@/components/branding/StatusScreen'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

type PaymentMethod = 'cod' | 'whish' | 'whatsapp'

function formatPrice(n: number) {
  return `$${n.toFixed(2)}`
}

export function CartPage() {
  const { items, total, loading, removeItem, clear, refresh } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [whishEnabled, setWhishEnabled] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    line1: '',
    city: '',
    country: 'Lebanon',
    postalCode: '',
    phone: '',
  })

  useEffect(() => {
    api<{ whishEnabled: boolean }>('/api/payments/config').then((res) => {
      if (res.success && res.data) setWhishEnabled(res.data.whishEnabled)
    })
  }, [])

  if (loading) return <LoadingScreen message="Loading cart" />

  if (items.length === 0) {
    return (
      <StatusScreen
        variant="info"
        title="Your bag is empty"
        message="Explore the full collection — 791 looks from Otherside Men."
        primaryAction={{ label: 'Shop collection', href: '/shop' }}
        secondaryAction={{ label: 'Go home', href: '/' }}
      />
    )
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setCheckoutError('')
    setCheckingOut(true)

    const res = await api<{ order: { _id: string }; whishCheckoutUrl?: string }>('/api/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ shippingAddress: form, paymentMethod }),
    })

    setCheckingOut(false)

    if (!res.success) {
      setCheckoutError(res.error ?? 'Checkout failed')
      navigate(`/order/failed?reason=${encodeURIComponent(res.error ?? 'Checkout failed')}`)
      return
    }

    await refresh()

    if (res.data?.whishCheckoutUrl) {
      window.location.href = res.data.whishCheckoutUrl
      return
    }

    navigate(`/order/success?orderId=${res.data?.order._id ?? ''}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 flex items-end justify-between">
        <h1 className="text-3xl font-black uppercase tracking-tight">Your Bag</h1>
        <button
          type="button"
          onClick={() => clear()}
          className="text-[10px] uppercase tracking-widest text-brand-muted hover:text-brand-white"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.size}-${item.color}`}
            className="flex items-center justify-between border border-white/10 p-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest">{item.name}</p>
              <p className="mt-1 text-[10px] text-brand-muted">
                {item.size} / {item.color} × {item.quantity}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="text-brand-muted hover:text-brand-white"
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
        <p className="text-sm font-semibold uppercase tracking-widest">Total</p>
        <p className="text-lg font-bold">{formatPrice(total)}</p>
      </div>

      {user ? (
        <form onSubmit={handleCheckout} className="mt-8 space-y-4 border border-white/10 p-6">
          <p className="text-[10px] uppercase tracking-widest text-brand-muted">Payment</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { id: 'cod' as PaymentMethod, label: 'Cash on delivery' },
              { id: 'whatsapp' as PaymentMethod, label: 'WhatsApp confirm' },
              ...(whishEnabled ? [{ id: 'whish' as PaymentMethod, label: 'Whish Pay' }] : []),
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPaymentMethod(opt.id)}
                className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${
                  paymentMethod === opt.id ? 'bg-brand-white text-brand-black' : 'border border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="text-[10px] uppercase tracking-widest text-brand-muted">Shipping</p>
          <input
            type="text"
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            className="w-full border border-white/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-white/50"
          />
          <input
            type="tel"
            placeholder="Phone (for delivery / WhatsApp)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            className="w-full border border-white/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-white/50"
          />
          <input
            type="text"
            placeholder="Address line"
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            required
            className="w-full border border-white/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-white/50"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
              className="w-full border border-white/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-white/50"
            />
            <input
              type="text"
              placeholder="Postal code"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              required
              className="w-full border border-white/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-white/50"
            />
          </div>
          <input
            type="text"
            placeholder="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            required
            className="w-full border border-white/20 bg-transparent px-4 py-3 text-sm focus:outline-none focus:border-white/50"
          />

          {checkoutError && <p className="text-sm text-red-400">{checkoutError}</p>}

          <Button variant="solid" fullWidth disabled={checkingOut}>
            {checkingOut ? 'Placing order...' : 'Place order'}
          </Button>
        </form>
      ) : (
        <div className="mt-8 text-center">
          <p className="mb-4 text-sm text-brand-muted">Sign in to checkout securely</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/login">
              <Button variant="solid">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
