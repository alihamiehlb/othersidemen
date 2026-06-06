import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'

export interface ProductFormData {
  _id?: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number
  category: string
  images: string[]
  sizes: string[]
  colors: string[]
  stock: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  instagramUrl?: string
}

const EMPTY: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  price: 99,
  category: 'looks',
  images: [''],
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Default'],
  stock: 10,
  isActive: true,
  isFeatured: false,
  tags: [],
}

const CATEGORIES = ['looks', 'tops', 'bottoms', 'outerwear', 'footwear', 'accessories']

interface ProductEditorProps {
  productId?: string
  onClose: () => void
  onSaved: () => void
}

export function ProductEditor({ productId, onClose, onSaved }: ProductEditorProps) {
  const [form, setForm] = useState<ProductFormData>(EMPTY)
  const [loading, setLoading] = useState(!!productId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!productId) return
    api<ProductFormData>(`/api/admin/products/${productId}`).then((res) => {
      if (res.success && res.data) {
        setForm({
          ...EMPTY,
          ...res.data,
          images: res.data.images?.length ? res.data.images : [''],
        })
      } else {
        setError(res.error ?? 'Failed to load product')
      }
      setLoading(false)
    })
  }, [productId])

  function updateField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      images: form.images.filter(Boolean),
      tags: form.tags.filter(Boolean),
      compareAtPrice: form.compareAtPrice || undefined,
      instagramUrl: form.instagramUrl || undefined,
    }

    const res = productId
      ? await api(`/api/admin/products/${productId}`, { method: 'PATCH', body: JSON.stringify(payload) })
      : await api('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) })

    setSaving(false)
    if (!res.success) {
      setError(res.error ?? 'Save failed')
      return
    }
    onSaved()
    onClose()
  }

  const inputClass =
    'w-full border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm focus:border-brand-white focus:outline-none'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-theme-subtle bg-brand-black p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-tight">
            {productId ? 'Edit Product' : 'New Product'}
          </h2>
          <button type="button" onClick={onClose} className="text-brand-muted hover:text-brand-white">
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-brand-muted">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[10px] uppercase tracking-widest text-brand-muted">
                Name
                <input className={`mt-1 ${inputClass}`} value={form.name} required onChange={(e) => updateField('name', e.target.value)} />
              </label>
              <label className="block text-[10px] uppercase tracking-widest text-brand-muted">
                Slug
                <input className={`mt-1 ${inputClass}`} value={form.slug} required onChange={(e) => updateField('slug', e.target.value)} />
              </label>
            </div>

            <label className="block text-[10px] uppercase tracking-widest text-brand-muted">
              Description
              <textarea className={`mt-1 min-h-[80px] ${inputClass}`} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-[10px] uppercase tracking-widest text-brand-muted">
                Price ($)
                <input type="number" min={0} step="0.01" className={`mt-1 ${inputClass}`} value={form.price} required onChange={(e) => updateField('price', Number(e.target.value))} />
              </label>
              <label className="block text-[10px] uppercase tracking-widest text-brand-muted">
                Compare at
                <input type="number" min={0} step="0.01" className={`mt-1 ${inputClass}`} value={form.compareAtPrice ?? ''} onChange={(e) => updateField('compareAtPrice', e.target.value ? Number(e.target.value) : undefined)} />
              </label>
              <label className="block text-[10px] uppercase tracking-widest text-brand-muted">
                Stock
                <input type="number" min={0} className={`mt-1 ${inputClass}`} value={form.stock} onChange={(e) => updateField('stock', Number(e.target.value))} />
              </label>
            </div>

            <label className="block text-[10px] uppercase tracking-widest text-brand-muted">
              Category
              <select className={`mt-1 ${inputClass}`} value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="block text-[10px] uppercase tracking-widest text-brand-muted">
              Image URL (path or https)
              <input
                className={`mt-1 ${inputClass}`}
                value={form.images[0] ?? ''}
                placeholder="/images/catalog/looks/example.webp"
                onChange={(e) => updateField('images', [e.target.value])}
              />
            </label>
            {form.images[0] && (
              <img src={form.images[0]} alt="Preview" className="h-32 w-24 rounded object-cover" />
            )}

            <label className="block text-[10px] uppercase tracking-widest text-brand-muted">
              Instagram URL
              <input className={`mt-1 ${inputClass}`} value={form.instagramUrl ?? ''} onChange={(e) => updateField('instagramUrl', e.target.value)} />
            </label>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} />
                Active
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => updateField('isFeatured', e.target.checked)} />
                Featured
              </label>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
