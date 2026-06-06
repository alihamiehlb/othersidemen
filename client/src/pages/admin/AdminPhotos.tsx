import { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { ProductEditor } from '@/components/admin/ProductEditor'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { api } from '@/lib/api'

interface ProductRow {
  _id: string
  name: string
  slug: string
  price: number
  category: string
  images: string[]
  isActive: boolean
}

export function AdminPhotos() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState('')
  const [editorId, setEditorId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '24' })
    if (category) params.set('category', category)
    api<ProductRow[]>(`/api/admin/products?${params}`).then((res) => {
      if (res.success && res.data) setProducts(res.data)
      setTotal(Number(res.meta?.total ?? 0))
      setLoading(false)
    })
  }, [page, category])

  useEffect(() => { load() }, [load])

  if (loading && products.length === 0) return <LoadingScreen message="Loading photos" />

  return (
    <div className="px-6 py-10 lg:px-10">
      <AdminPageHeader
        title="Photos"
        description={`${total} catalog images · click to edit product & price`}
        actions={
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {['looks', 'tops', 'bottoms', 'outerwear', 'footwear', 'accessories'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {products.map((p) => (
          <button
            key={p._id}
            type="button"
            onClick={() => setEditorId(p._id)}
            className="group overflow-hidden rounded border border-theme-subtle text-left transition-colors hover:border-brand-white/30"
          >
            <div className="relative aspect-[3/4] bg-brand-gray">
              {p.images[0] ? (
                <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-brand-muted">No image</div>
              )}
              {!p.isActive && (
                <span className="absolute left-2 top-2 rounded bg-red-500/90 px-2 py-0.5 text-[9px] uppercase text-white">
                  Inactive
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-[10px] font-semibold uppercase">{p.name}</p>
              <p className="mt-1 text-xs font-bold tabular-nums">${p.price.toFixed(2)}</p>
              <p className="mt-0.5 text-[10px] capitalize text-brand-muted">{p.category}</p>
            </div>
          </button>
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-8 text-sm text-brand-muted">No products in this category.</p>
      )}

      <AdminPagination page={page} total={total} limit={24} onPageChange={setPage} />

      {editorId && (
        <ProductEditor
          productId={editorId}
          onClose={() => setEditorId(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
