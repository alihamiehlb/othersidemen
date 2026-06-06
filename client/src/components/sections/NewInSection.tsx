import { useEffect, useState } from 'react'
import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { api } from '@/lib/api'
import { loadCatalogPreview } from '@/lib/catalogPreview'
import { dedupeByLookGroup, previewSection } from '@/lib/lookGroups'

export function NewInSection() {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await api<ProductCardData[]>('/api/products?featured=true&limit=24', {}, 2)
        if (!cancelled && res.success && res.data?.length) {
          const unique = dedupeByLookGroup(res.data).slice(0, 6)
          if (unique.length) {
            setProducts(unique)
            return
          }
        }
      } catch {
        /* fallback below */
      }

      const preview = await loadCatalogPreview()
      if (!cancelled) {
        const fallback = previewSection(preview, 'newIn').slice(0, 6)
        if (fallback.length) setProducts(fallback)
        else setError(true)
      }
    }

    load()
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="new-in" className="section-shell section-surface-dark" aria-labelledby="new-in-heading">
      <div className="store-container">
        <SectionHeader
          id="new-in-heading"
          eyebrow="New In — Men"
          title="New In"
          linkTo="/shop"
          linkLabel="Shop All"
        />

        {loading && <p className="text-sm text-theme-secondary">Loading products...</p>}
        {error && !loading && <p className="text-sm text-red-400">Could not load products. Please try again shortly.</p>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          {products.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} showWishlist />
          ))}
        </div>
      </div>
    </section>
  )
}
