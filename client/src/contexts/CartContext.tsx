import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  size: string
  color: string
  image?: string
}

interface CartData {
  items: CartItem[]
  total: number
  itemCount: number
}

interface CartContextValue extends CartData {
  loading: boolean
  addItem: (productId: string, quantity: number, size: string, color: string) => Promise<string | null>
  removeItem: (productId: string) => Promise<void>
  clear: () => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const res = await api<CartData>('/api/cart', {}, 3)
    if (res.success && res.data) {
      setItems(res.data.items)
      setTotal(res.data.total)
      setItemCount(res.data.itemCount)
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const addItem = useCallback(async (productId: string, quantity: number, size: string, color: string) => {
    const res = await api<CartData>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, size, color }),
    })
    if (!res.success) return res.error ?? 'Failed to add item'
    if (res.data) {
      setItems(res.data.items)
      setTotal(res.data.total)
      setItemCount(res.data.items.reduce((s, i) => s + i.quantity, 0))
    }
    return null
  }, [])

  const removeItem = useCallback(async (productId: string) => {
    await api(`/api/cart/items/${productId}`, { method: 'DELETE' })
    await refresh()
  }, [refresh])

  const clear = useCallback(async () => {
    await api('/api/cart', { method: 'DELETE' })
    setItems([])
    setTotal(0)
    setItemCount(0)
  }, [])

  const value = useMemo(
    () => ({ items, total, itemCount, loading, addItem, removeItem, clear, refresh }),
    [items, total, itemCount, loading, addItem, removeItem, clear, refresh],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
