import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Loader2, MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProductImage } from '@/components/ui/ProductImage'
import { useCart } from '@/contexts/CartContext'
import {
  defaultColors,
  defaultSizes,
  displayProductDescription,
  displayProductName,
} from '@/lib/productDisplay'
import { buildWhatsAppOrderUrl } from '@/lib/whatsapp'
import type { ProductCardData } from '@/components/ui/ProductCard'

export interface ProductDetail extends ProductCardData {
  description?: string
  sizes?: string[]
  colors?: string[]
  instagramUrl?: string
}

interface ProductModalProps {
  product: ProductDetail | null
  loading?: boolean
  onClose: () => void
}

export function ProductModal({ product, loading = false, onClose }: ProductModalProps) {
  const { addItem } = useCart()
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)

  const sizes = product ? defaultSizes(product.category, product.sizes) : []
  const colors = product ? defaultColors(product.category, product.colors) : []

  useEffect(() => {
    if (!product) return
    const nextSizes = defaultSizes(product.category, product.sizes)
    const nextColors = defaultColors(product.category, product.colors)
    setSize(nextSizes[0] ?? 'One Size')
    setColor(nextColors[0] ?? 'As shown')
    setMessage('')
  }, [product])

  useEffect(() => {
    if (!product) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [product, onClose])

  if (!product) return null

  const title = displayProductName(product.name)
  const description = product.description ? displayProductDescription(product.description) : ''

  const whatsappUrl = buildWhatsAppOrderUrl({
    name: title,
    price: product.price,
    size,
    color,
    slug: product.slug,
  })

  async function handleAddToCart() {
    if (!size || !color) {
      setMessage('Select size and color')
      return
    }
    setAdding(true)
    setMessage('')
    const err = await addItem(product!._id, 1, size, color)
    setAdding(false)
    setMessage(err ?? 'Added to bag')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl border border-theme-subtle bg-brand-black shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-theme-subtle bg-brand-black/80 p-2 text-brand-white hover:bg-brand-gray"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="grid gap-0 sm:grid-cols-2">
          <div className="flex min-h-[320px] items-center justify-center bg-brand-gray sm:min-h-[480px]">
            <ProductImage
              src={product.images[0]}
              alt={title}
              fit="contain"
              className="max-h-[70vh] w-full"
              containerClassName="flex h-full min-h-[320px] w-full items-center justify-center sm:min-h-[480px]"
            />
          </div>

          <div className="flex flex-col p-6 sm:p-8">
            {loading && (
              <p className="mb-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-muted">
                <Loader2 size={12} className="animate-spin" />
                Loading details…
              </p>
            )}

            {product.category && (
              <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-brand-muted">{product.category}</p>
            )}
            <h2 id="product-modal-title" className="mb-3 text-xl font-black uppercase tracking-tight sm:text-2xl">
              {title}
            </h2>
            <p className="mb-4 text-lg tabular-nums">${product.price.toFixed(2)}</p>
            {description && (
              <p className="mb-6 max-h-32 overflow-y-auto text-sm leading-relaxed text-brand-muted">
                {description}
              </p>
            )}

            <div className="mb-4">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-brand-muted">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase ${
                      size === s ? 'bg-brand-white text-brand-black' : 'border border-theme-subtle'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-brand-muted">Color</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase ${
                      color === c ? 'bg-brand-white text-brand-black' : 'border border-theme-subtle'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <Button variant="solid" onClick={handleAddToCart} disabled={loading || adding}>
                {adding ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Adding…
                  </span>
                ) : (
                  'Add to Bag'
                )}
              </Button>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-[#25D366]/40 bg-[#25D366]/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#25D366] transition-colors hover:bg-[#25D366]/20"
                >
                  <MessageCircle size={16} />
                  Order on WhatsApp
                </a>
              ) : null}
              <Link
                to={`/product/${product.slug}`}
                onClick={onClose}
                className="text-center text-[10px] uppercase tracking-widest text-brand-muted underline underline-offset-2 hover:text-brand-white"
              >
                Open full product page
              </Link>
              {product.instagramUrl && (
                <a
                  href={product.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-[10px] uppercase tracking-widest text-brand-muted underline underline-offset-2 hover:text-brand-white"
                >
                  View on Instagram
                </a>
              )}
              {message && (
                <p className={`text-center text-sm ${message === 'Added to bag' ? 'text-brand-light' : 'text-brand-muted'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
