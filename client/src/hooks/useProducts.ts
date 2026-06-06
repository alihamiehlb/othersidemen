import { useEffect, useState } from 'react'
import type { ProductCardData } from '@/components/ui/ProductCard'
import { api } from '@/lib/api'
import { loadCatalogPreview, previewProducts } from '@/lib/catalogPreview'

export function useProducts(category: string | undefined, limit: number) {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    setUsingFallback(false)

    const params = new URLSearchParams({ limit: String(limit) })
    if (category) params.set('category', category)

    const applyFallback = async () => {
      const preview = await loadCatalogPreview()
      if (cancelled) return
      const pool = previewProducts(preview, category, limit)
      if (pool.length) {
        setProducts(pool)
        setUsingFallback(true)
      } else {
        setError(true)
      }
    }

    api<ProductCardData[]>(`/api/products?${params.toString()}`, {}, 1)
      .then(async (res) => {
        if (cancelled) return
        if (res.success && res.data?.length) {
          setProducts(res.data)
          return
        }
        await applyFallback()
      })
      .catch(() => {
        if (!cancelled) void applyFallback()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [category, limit])

  return { products, loading, error, usingFallback }
}
