import { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { ProductEditor } from '@/components/admin/ProductEditor'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { Button } from '@/components/ui/Button'
import { ProductImage } from '@/components/ui/ProductImage'
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
  tags: string[]
  sizes: string[]
  colors: string[]
}

const PAGE_SIZES = [20, 50, 100]

export function AdminProducts() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [editorId, setEditorId] = useState<string | undefined | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    api<ProductRow[]>(`/api/admin/products?${params}`).then((res) => {
      if (res.success && res.data) setProducts(res.data)
      setTotal(Number(res.meta?.total ?? 0))
      setLoading(false)
    })
  }, [page, pageSize, search, category])

  useEffect(() => { load() }, [load])

  async function deactivate(id: string) {
    if (!window.confirm('Deactivate this product?')) return
    await api(`/api/admin/products/${id}`, { method: 'DELETE' })
    load()
  }

  async function deletePermanent(id: string, name: string) {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    const res = await api(`/api/admin/products/${id}?permanent=true`, { method: 'DELETE' })
    if (res.success) load()
    else alert(res.error ?? 'Delete failed')
  }

  async function reactivate(id: string) {
    const res = await api(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: true }),
    })
    if (res.success) load()
    else alert(res.error ?? 'Reactivate failed')
  }

  if (loading && products.length === 0) return <LoadingScreen message="Loading products" />

  return (
    <div className="page-enter px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Products"
        description={`${total} items · manage price, tags, sizes, colors & photos`}
        actions={<Button onClick={() => setEditorId(undefined)}>Add product</Button>}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name or slug..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="admin-field min-w-[200px] flex-1 border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="admin-field border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {['looks', 'tops', 'bottoms', 'outerwear', 'footwear', 'accessories'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
          className="admin-field border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
      </div>

      <div className="hidden overflow-x-auto rounded border border-theme-subtle lg:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-brand-dark/60">
            <tr className="text-[10px] uppercase tracking-widest text-theme-secondary">
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-brand-dark/30">
                <td className="px-4 py-3">
                  <div className="h-14 w-10 overflow-hidden rounded bg-brand-gray">
                    <ProductImage src={p.images[0]} alt={p.name} className="h-full w-full" containerClassName="h-full w-full" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-[10px] text-theme-secondary">{p.slug}</p>
                </td>
                <td className="px-4 py-3 capitalize text-theme-secondary">{p.category}</td>
                <td className="px-4 py-3 tabular-nums">
                  ${p.price.toFixed(2)}
                  {p.compareAtPrice ? (
                    <span className="ml-1 text-[10px] text-theme-secondary line-through">${p.compareAtPrice.toFixed(2)}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                <td className="max-w-[140px] truncate px-4 py-3 text-[10px] text-theme-secondary">
                  {(p.tags ?? []).join(', ') || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={p.isActive ? 'text-green-500' : 'text-red-400'}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {p.isFeatured && <span className="ml-2 text-theme-secondary">★</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setEditorId(p._id)} className="text-[10px] uppercase tracking-widest hover:underline">
                      Edit
                    </button>
                    {p.isActive ? (
                      <button type="button" onClick={() => deactivate(p._id)} className="text-[10px] uppercase tracking-widest text-amber-400 hover:underline">
                        Deactivate
                      </button>
                    ) : (
                      <button type="button" onClick={() => reactivate(p._id)} className="text-[10px] uppercase tracking-widest text-green-400 hover:underline">
                        Activate
                      </button>
                    )}
                    <button type="button" onClick={() => deletePermanent(p._id, p.name)} className="text-[10px] uppercase tracking-widest text-red-400 hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {products.map((p) => (
          <div key={p._id} className="rounded border border-theme-subtle p-4">
            <div className="flex gap-3">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded bg-brand-gray">
                <ProductImage src={p.images[0]} alt={p.name} className="h-full w-full" containerClassName="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-[10px] text-theme-secondary">{p.slug}</p>
                <p className="mt-1 text-sm font-bold tabular-nums">${p.price.toFixed(2)} · {p.stock} in stock</p>
                <p className="text-[10px] capitalize text-theme-secondary">{p.category}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => setEditorId(p._id)} className="text-[10px] uppercase tracking-widest">Edit</button>
              <button type="button" onClick={() => deletePermanent(p._id, p.name)} className="text-[10px] uppercase tracking-widest text-red-400">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <AdminPagination page={page} total={total} limit={pageSize} onPageChange={setPage} />

      {editorId !== null && (
        <ProductEditor productId={editorId} onClose={() => setEditorId(null)} onSaved={load} />
      )}
    </div>
  )
}
