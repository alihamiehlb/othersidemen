import { useEffect, useState } from 'react'
import { ProductImage } from '@/components/ui/ProductImage'
import { Button } from '@/components/ui/Button'
import { api, apiUpload } from '@/lib/api'
import { slugifyName } from '@/lib/slugify'

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

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function normalizeImagePath(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function ProductEditor({ productId, onClose, onSaved }: ProductEditorProps) {
  const [form, setForm] = useState<ProductFormData>(EMPTY)
  const [sizesText, setSizesText] = useState('S, M, L, XL')
  const [colorsText, setColorsText] = useState('Default')
  const [tagsText, setTagsText] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(!!productId)
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!productId) return
    api<ProductFormData>(`/api/admin/products/${productId}`).then((res) => {
      if (res.success && res.data) {
        const data = {
          ...EMPTY,
          ...res.data,
          images: res.data.images?.length ? res.data.images : [''],
        }
        setForm(data)
        setSizesText((data.sizes ?? []).join(', '))
        setColorsText((data.colors ?? []).join(', '))
        setTagsText((data.tags ?? []).join(', '))
        setSlugTouched(true)
      } else {
        setError(res.error ?? 'Failed to load product')
      }
      setLoading(false)
    })
  }, [productId])

  function updateField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && !slugTouched && !productId) {
        next.slug = slugifyName(String(value))
      }
      return next
    })
  }

  function updateImage(idx: number, value: string) {
    setForm((prev) => {
      const images = [...prev.images]
      images[idx] = normalizeImagePath(value)
      return { ...prev, images }
    })
  }

  function addImageField() {
    setForm((prev) => ({ ...prev, images: [...prev.images, ''] }))
  }

  function removeImageField(idx: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }))
  }

  async function handleImageUpload(idx: number, file: File) {
    setUploadingIdx(idx)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', form.category)
    if (form.slug) formData.append('slug', form.slug)

    const res = await apiUpload<{ url: string }>('/api/admin/upload', formData)
    setUploadingIdx(null)

    if (!res.success || !res.data?.url) {
      setError(res.error ?? 'Image upload failed')
      return
    }
    updateImage(idx, res.data.url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const images = form.images.map(normalizeImagePath).filter(Boolean)
    if (images.length === 0) {
      setError('Add at least one image (upload or paste a path)')
      setSaving(false)
      return
    }

    const slug = slugifyName(form.slug || form.name)
    if (!slug) {
      setError('Enter a valid product name or slug')
      setSaving(false)
      return
    }

    const payload = {
      ...form,
      slug,
      images,
      sizes: parseList(sizesText),
      colors: parseList(colorsText),
      tags: parseList(tagsText),
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
    'admin-field mt-1 w-full border border-theme-subtle bg-theme-input-bg px-3 py-2 text-sm text-brand-white focus:border-brand-white focus:outline-none'

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-theme-subtle bg-brand-black p-5 shadow-xl sm:rounded-sm sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-lg font-black uppercase tracking-tight">
            {productId ? 'Edit Product' : 'New Product'}
          </h2>
          <button type="button" onClick={onClose} className="text-theme-secondary hover:text-brand-white">
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-theme-secondary">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
                Name
                <input className={inputClass} value={form.name} required onChange={(e) => updateField('name', e.target.value)} />
              </label>
              <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
                Slug
                <input
                  className={inputClass}
                  value={form.slug}
                  required
                  onChange={(e) => {
                    setSlugTouched(true)
                    updateField('slug', e.target.value)
                  }}
                  placeholder="auto-generated-from-name"
                />
              </label>
            </div>

            <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
              Description
              <textarea className={`min-h-[80px] ${inputClass}`} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
                Price ($)
                <input type="number" min={0} step="0.01" className={inputClass} value={form.price} required onChange={(e) => updateField('price', Number(e.target.value))} />
              </label>
              <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
                Compare at
                <input type="number" min={0} step="0.01" className={inputClass} value={form.compareAtPrice ?? ''} onChange={(e) => updateField('compareAtPrice', e.target.value ? Number(e.target.value) : undefined)} />
              </label>
              <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
                Stock
                <input type="number" min={0} className={inputClass} value={form.stock} onChange={(e) => updateField('stock', Number(e.target.value))} />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
                Category
                <select className={inputClass} value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
                Tags (comma-separated)
                <input className={inputClass} value={tagsText} placeholder="streetwear, new, sale" onChange={(e) => setTagsText(e.target.value)} />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
                Sizes (comma-separated)
                <input className={inputClass} value={sizesText} onChange={(e) => setSizesText(e.target.value)} />
              </label>
              <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
                Colors (comma-separated)
                <input className={inputClass} value={colorsText} onChange={(e) => setColorsText(e.target.value)} />
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-theme-secondary">Gallery images</p>
                <button type="button" onClick={addImageField} className="text-[10px] uppercase tracking-widest hover:underline">
                  + Add image
                </button>
              </div>
              <p className="mb-3 text-[10px] text-theme-secondary">
                Upload from phone or laptop — images are converted to WebP automatically.
              </p>
              <div className="space-y-3">
                {form.images.map((img, idx) => (
                  <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <div className="h-24 w-20 shrink-0 overflow-hidden rounded bg-brand-gray">
                      {img ? (
                        <ProductImage src={img} alt={`Preview ${idx + 1}`} className="h-full w-full" containerClassName="h-full w-full" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[9px] text-theme-secondary">No image</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <label className="cursor-pointer rounded border border-dashed border-theme-subtle px-3 py-2 text-center text-[10px] uppercase tracking-widest text-theme-secondary hover:border-brand-white hover:text-brand-white">
                        {uploadingIdx === idx ? 'Uploading…' : 'Upload photo'}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          disabled={uploadingIdx !== null}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) void handleImageUpload(idx, file)
                            e.target.value = ''
                          }}
                        />
                      </label>
                      <div className="flex gap-2">
                        <input
                          className={`flex-1 ${inputClass}`}
                          value={img}
                          placeholder="/images/catalog/looks/example.webp"
                          onChange={(e) => updateImage(idx, e.target.value)}
                        />
                        {form.images.length > 1 && (
                          <button type="button" onClick={() => removeImageField(idx)} className="shrink-0 px-2 text-red-400">
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <label className="block text-[10px] uppercase tracking-widest text-theme-secondary">
              Instagram URL
              <input className={inputClass} value={form.instagramUrl ?? ''} onChange={(e) => updateField('instagramUrl', e.target.value)} />
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

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" disabled={saving || uploadingIdx !== null} className="w-full sm:w-auto">
                {saving ? 'Saving...' : 'Save Product'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
