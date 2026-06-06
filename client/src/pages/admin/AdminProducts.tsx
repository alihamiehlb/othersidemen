import { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { ProductEditor } from '@/components/admin/ProductEditor'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'

interface ProductRow {
  _id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  category: string
  stock: number
  isActive: boolean
  isFeatured: boolean
  images: string[]
}

export function AdminProducts() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [editorId, setEditorId] = useState<string | undefined | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    api<ProductRow[]>(`/api/admin/products?${params}`).then((res) => {
      if (res.success && res.data) setProducts(res.data)
      setTotal(Number(res.meta?.total ?? 0))
      setLoading(false)
    })
  }, [page, search, category])

  useEffect(() => { load() }, [load])

  async function deactivate(id: string) {
    if (!window.confirm('Deactivate this product?')) return
    await api(`/api/admin/products/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading && products.length === 0) return <LoadingScreen message="Loading products" />

  return (
    <div className="px-6 py-10 lg:px-10">
      <AdminPageHeader
        title="Products"
        description={`${total} items · names, prices, stock, photos`}
        actions={<Button onClick={() => setEditorId(undefined)}>Add product</Button>}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name or slug..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="min-w-[200px] flex-1 border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
        />
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
      </div>

      <div className="overflow-x-auto rounded border border-theme-subtle">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-brand-dark/60">
            <tr className="text-[10px] uppercase tracking-widest text-brand-muted">
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-brand-dark/30">
                <td className="px-4 py-3">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt="" className="h-14 w-10 rounded object-cover" />
                  ) : (
                    <span className="text-brand-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-[10px] text-brand-muted">{p.slug}</p>
                </td>
                <td className="px-4 py-3 capitalize text-brand-muted">{p.category}</td>
                <td className="px-4 py-3 tabular-nums">
                  ${p.price.toFixed(2)}
                  {p.compareAtPrice ? (
                    <span className="ml-1 text-[10px] text-brand-muted line-through">${p.compareAtPrice.toFixed(2)}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                <td className="px-4 py-3">
                  <span className={p.isActive ? 'text-green-500' : 'text-red-400'}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {p.isFeatured && <span className="ml-2 text-brand-muted">★</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => setEditorId(p._id)} className="text-[10px] uppercase tracking-widest hover:underline">
                      Edit
                    </button>
                    {p.isActive && (
                      <button type="button" onClick={() => deactivate(p._id)} className="text-[10px] uppercase tracking-widest text-red-400 hover:underline">
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination page={page} total={total} limit={20} onPageChange={setPage} />

      {editorId !== null && (
        <ProductEditor productId={editorId} onClose={() => setEditorId(null)} onSaved={load} />
      )}
    </div>
  )
}
