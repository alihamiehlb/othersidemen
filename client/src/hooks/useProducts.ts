import { useEffect, useState } from 'react'
import type { ProductCardData } from '@/components/ui/ProductCard'
import { api } from '@/lib/api'
import { loadCatalogPreview } from '@/lib/catalogPreview'
import { dedupeByLookGroup, previewSection } from '@/lib/lookGroups'

type PreviewSection = 'looks' | 'styleDna' | 'newIn' | 'featured'

export function useProducts(
  category: string | undefined,
  limit: number,
  options?: { previewSection?: PreviewSection; skip?: number; featured?: boolean },
) {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    setUsingFallback(false)

    const params = new URLSearchParams({ limit: String(Math.max(limit, limit + (options?.skip ?? 0))) })
    if (category) params.set('category', category)
    if (options?.featured) params.set('featured', 'true')

    const applyFallback = async () => {
      const preview = await loadCatalogPreview()
      if (cancelled) return
      let pool: ProductCardData[] = []
      if (options?.previewSection) {
        pool = previewSection(preview, options.previewSection)
      } else if (category === 'looks') {
        pool = dedupeByLookGroup(preview?.looks ?? [])
      } else if (preview?.all) {
        pool = category ? preview.all.filter((p) => p.category === category) : preview.all
      }
      const sliced = pool.slice(0, limit)
      if (sliced.length) {
        setProducts(sliced)
        setUsingFallback(true)
      } else {
        setError(true)
      }
    }

    api<ProductCardData[]>(`/api/products?${params.toString()}`, {}, 2)
      .then(async (res) => {
        if (cancelled) return
        if (res.success && res.data?.length) {
          let list = category === 'looks' ? dedupeByLookGroup(res.data) : res.data
          if (options?.skip) list = list.slice(options.skip)
          list = list.slice(0, limit)
          if (list.length) {
            setProducts(list)
            return
          }
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
  }, [category, limit, options?.previewSection, options?.skip, options?.featured])

  return { products, loading, error, usingFallback }
}
