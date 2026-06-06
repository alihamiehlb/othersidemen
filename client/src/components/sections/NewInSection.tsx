import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard'
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
    <section id="new-in" className="bg-brand-black px-6 py-20 lg:px-10" aria-labelledby="new-in-heading">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-brand-muted">New In — Men</p>
            <h2 id="new-in-heading" className="text-3xl font-black uppercase tracking-tight lg:text-4xl">New In</h2>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-white transition-colors hover:text-brand-light">
            Shop All
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading && <p className="text-sm text-brand-muted">Loading products...</p>}
        {error && !loading && <p className="text-sm text-red-400">Could not load products. Please try again shortly.</p>}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {products.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} showWishlist />
          ))}
        </div>
      </div>
    </section>
  )
}
