import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { LoadingScreen } from '@/components/branding/LoadingScreen'

import { ErrorScreen } from '@/components/branding/ErrorScreen'

import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard'

import { ProductModal } from '@/components/ui/ProductModal'
import { useProductModal } from '@/hooks/useProductModal'
import { api } from '@/lib/api'

const CATEGORIES = ['all', 'looks', 'outerwear', 'tops', 'bottoms', 'footwear', 'accessories'] as const

const PAGE_SIZE = 24

type Category = (typeof CATEGORIES)[number]

export function ShopPage() {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category')
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [category, setCategory] = useState<Category>(
    initialCategory && CATEGORIES.includes(initialCategory as Category)
      ? (initialCategory as Category)
      : 'all',
  )
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const { selected, loading: modalLoading, openProduct, closeProduct } = useProductModal()
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingPageRef = useRef(false)

  const hasMore = products.length < total

  const loadPage = useCallback(async (pageNum: number, cat: Category, replace: boolean) => {
    const params = new URLSearchParams({
      page: String(pageNum),
      limit: String(PAGE_SIZE),
    })
    if (cat !== 'all') params.set('category', cat)

    const res = await api<ProductCardData[]>(`/api/products?${params}`, {}, 4)
    if (!res.success || !res.data) return false

    const nextTotal = typeof res.meta?.total === 'number' ? res.meta.total : res.data.length
    setTotal(nextTotal)
    setProducts((prev) => (replace ? res.data! : [...prev, ...res.data!]))
    return true
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(false)
    setPage(1)
    loadPage(1, category, true)
      .then((ok) => setError(!ok))
      .finally(() => setLoading(false))
  }, [category, loadPage])

  useEffect(() => {
    if (page === 1) return
    if (loadingPageRef.current) return
    loadingPageRef.current = true
    setLoadingMore(true)
    loadPage(page, category, false).finally(() => {
      loadingPageRef.current = false
      setLoadingMore(false)
    })
  }, [page, category, loadPage])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((p) => p + 1)
        }
      },
      { rootMargin: '400px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore])

  function handleSelect(product: ProductCardData) {
    void openProduct(product)
  }

  if (loading) return <LoadingScreen message="Loading collection" />
  if (error) return <ErrorScreen title="Collection unavailable" onRetry={() => window.location.reload()} />

  return (
    <div className="page-enter mx-auto max-w-[1600px] px-6 py-16 lg:px-10">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-brand-muted">Men&apos;s Collection</p>
      <h1 className="mb-2 text-3xl font-black uppercase tracking-tight lg:text-4xl">Shop All</h1>
      <p className="mb-6 text-sm text-brand-muted">{total} items — scroll to load more</p>

      <div className="mb-10 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              category === cat
                ? 'bg-brand-white text-brand-black'
                : 'border border-white/20 text-brand-muted hover:border-white/40 hover:text-brand-white'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((p, i) => (
          <ProductCard key={p._id} product={p} index={i} onSelect={handleSelect} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-8 text-sm text-brand-muted">No products in this category.</p>
      )}

      <div ref={sentinelRef} className="h-8" aria-hidden="true" />

      {loadingMore && (
        <p className="mt-8 text-center text-sm text-brand-muted">Loading more…</p>
      )}

      {!hasMore && products.length > 0 && (
        <p className="mt-8 text-center text-[10px] uppercase tracking-widest text-brand-muted">
          End of collection
        </p>
      )}

      <ProductModal product={selected} loading={modalLoading} onClose={closeProduct} />
    </div>
  )
}
