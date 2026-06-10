import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { LoadingScreen } from '@/components/branding/LoadingScreen'

import { ErrorScreen } from '@/components/branding/ErrorScreen'

import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard'

import { ProductModal } from '@/components/ui/ProductModal'
import { SeoHead, buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/components/seo/SeoHead'
import { useProductModal } from '@/hooks/useProductModal'
import { api } from '@/lib/api'
import { loadCatalogPreview, previewProducts, previewProductTotal } from '@/lib/catalogPreview'

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

    const res = await api<ProductCardData[]>(`/api/products?${params}`, {}, 2)
    if (res.success && res.data) {
      const nextTotal = typeof res.meta?.total === 'number' ? res.meta.total : res.data.length
      setTotal(nextTotal)
      setProducts((prev) => (replace ? res.data! : [...prev, ...res.data!]))
      return true
    }

    if (replace || pageNum === 1) {
      const preview = await loadCatalogPreview()
      const fallback = previewProducts(preview, cat === 'all' ? undefined : cat, PAGE_SIZE, pageNum)
      if (fallback.length) {
        setTotal(previewProductTotal(preview, cat === 'all' ? undefined : cat))
        setProducts((prev) => (replace ? fallback : [...prev, ...fallback]))
        return true
      }
    }

    return false
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

  const canonicalPath = category === 'all' ? '/shop' : `/shop?category=${category}`
  const shopTitle =
    category === 'all'
      ? "Shop All — Men's Streetwear"
      : `Shop ${category.charAt(0).toUpperCase() + category.slice(1)} — Men's Streetwear`
  const shopDescription =
    category === 'all'
      ? "Browse the full OTHER SIDE men's collection — 791+ looks, outerwear, tops, footwear, and accessories. Based in Lebanon, ships worldwide."
      : `Shop OTHER SIDE ${category} — premium men's streetwear from Baabda, Lebanon.`

  const shopJsonLd = useMemo(
    () => [
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Shop', path: '/shop' },
        ...(category !== 'all'
          ? [{ name: category.charAt(0).toUpperCase() + category.slice(1), path: canonicalPath }]
          : []),
      ]),
      buildItemListJsonLd(
        products.slice(0, 24).map((p) => ({ name: p.name, slug: p.slug })),
        shopTitle,
      ),
    ],
    [products, category, canonicalPath, shopTitle],
  )

  if (loading) return <LoadingScreen message="Loading collection" />
  if (error) return <ErrorScreen title="Collection unavailable" onRetry={() => window.location.reload()} />

  return (
    <>
      <SeoHead
        title={shopTitle}
        description={shopDescription}
        canonicalPath={canonicalPath}
        jsonLd={shopJsonLd}
      />
    <div className="page-enter section-shell">
      <div className="store-container">
      <p className="section-eyebrow">Men&apos;s Collection</p>
      <h1 className="section-title mb-2">Shop All</h1>
      <p className="mb-6 text-sm text-theme-secondary">{total} items — scroll to load more</p>

      <div className="-mx-1 mb-8 flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              category === cat
                ? 'bg-brand-white text-brand-black'
                : 'border border-theme-subtle text-brand-muted hover:text-brand-white'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
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
    </div>
    </>
  )
}
