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

    const sliceList = (list: ProductCardData[]) => {
      let out = category === 'looks' ? dedupeByLookGroup(list) : list
      if (options?.skip) out = out.slice(options.skip)
      return out.slice(0, limit)
    }

    const applyPreview = async () => {
      const preview = await loadCatalogPreview()
      if (cancelled) return false
      let pool: ProductCardData[] = []
      if (options?.previewSection) {
        pool = previewSection(preview, options.previewSection)
      } else if (category === 'looks') {
        pool = dedupeByLookGroup(preview?.looks ?? [])
      } else if (preview?.all) {
        pool = category ? preview.all.filter((p) => p.category === category) : preview.all
      }
      const sliced = sliceList(pool)
      if (sliced.length) {
        setProducts(sliced)
        setUsingFallback(true)
        return true
      }
      return false
    }

    async function load() {
      // Curated homepage sections always use catalog-preview (deduped, correct categories).
      if (options?.previewSection) {
        const ok = await applyPreview()
        if (!cancelled) {
          if (!ok) setError(true)
          setLoading(false)
        }
        return
      }

      const params = new URLSearchParams({ limit: String(Math.max(limit, limit + (options?.skip ?? 0))) })
      if (category) params.set('category', category)
      if (options?.featured) params.set('featured', 'true')

      try {
        const res = await api<ProductCardData[]>(`/api/products?${params.toString()}`, {}, 2)
        if (cancelled) return
        if (res.success && res.data?.length) {
          const list = sliceList(res.data)
          if (list.length) {
            setProducts(list)
            setLoading(false)
            return
          }
        }
        const ok = await applyPreview()
        if (!cancelled) {
          if (!ok) setError(true)
          setLoading(false)
        }
      } catch {
        if (cancelled) return
        const ok = await applyPreview()
        if (!cancelled) {
          if (!ok) setError(true)
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [category, limit, options?.previewSection, options?.skip, options?.featured])

  return { products, loading, error, usingFallback }
}
