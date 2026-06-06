import { useEffect, useState } from 'react'
import type { ProductCardData } from '@/components/ui/ProductCard'
import { api } from '@/lib/api'

export function useProducts(category: string | undefined, limit: number) {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (category) params.set('category', category)
    api<ProductCardData[]>(`/api/products?${params.toString()}`, {}, 2)
      .then((res) => {
        if (res.success && res.data) setProducts(res.data)
        else setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [category, limit])

  return { products, loading, error }
}
