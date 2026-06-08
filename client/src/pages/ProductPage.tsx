import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { ErrorScreen } from '@/components/branding/ErrorScreen'
import { ProductImage } from '@/components/ui/ProductImage'
import { SeoHead, buildProductJsonLd } from '@/components/seo/SeoHead'
import { useCart } from '@/contexts/CartContext'
import { api } from '@/lib/api'
import { loadLookGroup } from '@/lib/lookGroups'
import {
  defaultColors,
  defaultSizes,
  displayProductDescription,
  displayProductName,
} from '@/lib/productDisplay'
import { buildWhatsAppOrderUrl } from '@/lib/whatsapp'

interface Product {
  _id: string
  name: string
  slug: string
  description: string
  price: number
  sizes: string[]
  colors: string[]
  images: string[]
  category?: string
  instagramUrl?: string
}

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [gallery, setGallery] = useState<string[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      const currentSlug = slug!
      const [res, group] = await Promise.all([
        api<Product>(`/api/products/${currentSlug}`, {}, 4),
        loadLookGroup(currentSlug),
      ])
      if (cancelled) return

      if (res.success && res.data) {
        setProduct(res.data)
        const images = group?.images?.length
          ? group.images
          : res.data.images?.length
            ? res.data.images
            : []
        setGallery(images)
        setSize(defaultSizes(res.data.category, res.data.sizes)[0] ?? 'One Size')
        setColor(defaultColors(res.data.category, res.data.colors)[0] ?? 'As shown')
        setLoadError(null)
      } else if (res.error?.toLowerCase().includes('not found')) {
        setProduct(null)
        setLoadError(null)
      } else {
        setProduct(null)
        setLoadError(res.error ?? 'Unable to load this product. Please try again.')
      }
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug, reloadKey])

  if (loading) return <LoadingScreen message="Loading product" />
  if (loadError) {
    return (
      <ErrorScreen
        title="Could not load product"
        message={loadError}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    )
  }
  if (!product) return <ErrorScreen title="Product not found" message="This item may no longer be available." />

  const title = displayProductName(product.name)
  const description = displayProductDescription(product.description)
  const sizes = defaultSizes(product.category, product.sizes)
  const colors = defaultColors(product.category, product.colors)
  const images = gallery.length ? gallery : product.images

  const whatsappUrl = buildWhatsAppOrderUrl({
    name: title,
    price: product.price,
    size,
    color,
    slug: product.slug,
  })

  async function handleAdd() {
    if (!size || !color) {
      setMessage('Select size and color')
      return
    }
    setAdding(true)
    setMessage('')
    try {
      const err = await addItem(product!._id, 1, size, color)
      setMessage(err ?? 'Added to bag')
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <SeoHead
        title={title}
        description={description || `${title} — men's streetwear at OTHER SIDE.`}
        canonicalPath={`/product/${product.slug}`}
        ogType="product"
        ogImage={images[0] ?? '/images/hero.webp'}
        jsonLd={buildProductJsonLd({
          name: title,
          slug: product.slug,
          description,
          price: product.price,
          images,
          category: product.category,
        })}
      />
      <div className="page-enter mx-auto max-w-[1200px] px-6 py-8 lg:px-10 lg:py-12">
        <Link
          to={product.category ? `/shop?category=${product.category}` : '/shop'}
          className="mb-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-brand-muted transition-colors hover:text-brand-white"
        >
          <ChevronLeft size={14} />
          Back to collection
        </Link>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl bg-brand-gray">
              <ProductImage
                src={images[activeImage]}
                alt={title}
                fit="contain"
                className="max-h-[70vh] w-full"
                containerClassName="flex min-h-[360px] w-full items-center justify-center lg:min-h-[520px]"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                      i === activeImage ? 'border-brand-white' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`View image ${i + 1} of ${images.length}`}
                  >
                    <ProductImage src={src} alt="" fit="cover" className="h-full w-full" containerClassName="h-full w-full" />
                  </button>
                ))}
              </div>
            )}
            {images.length > 1 && (
              <p className="text-[10px] uppercase tracking-widest text-brand-muted">
                {images.length} shots from this look — swipe thumbnails to explore
              </p>
            )}
          </div>

          <div className="flex flex-col lg:py-4">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-brand-muted">
              {product.category ? `${product.category} — Men` : "Men's"}
            </p>
            <h1 className="mb-4 text-2xl font-black uppercase tracking-tight lg:text-3xl">{title}</h1>
            <p className="mb-6 text-2xl tabular-nums">${product.price.toFixed(2)}</p>
            {description && (
              <p className="mb-8 text-sm leading-relaxed text-brand-muted">{description}</p>
            )}

            <div className="mb-6">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-brand-muted">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`px-4 py-2 text-xs font-semibold uppercase ${size === s ? 'bg-brand-white text-brand-black' : 'border border-theme-subtle'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-brand-muted">Color</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`px-4 py-2 text-xs font-semibold uppercase ${color === c ? 'bg-brand-white text-brand-black' : 'border border-theme-subtle'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <Button variant="solid" onClick={handleAdd} disabled={adding} className="w-full sm:w-auto">
                {adding ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    Adding…
                  </>
                ) : (
                  'Add to Bag'
                )}
              </Button>
              <a
                href={whatsappUrl}
                className="inline-flex w-full items-center justify-center gap-2 border border-[#25D366]/40 bg-[#25D366]/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#25D366] hover:bg-[#25D366]/20 sm:w-auto"
              >
                <MessageCircle size={16} />
                Order on WhatsApp
              </a>
              {product.instagramUrl && (
                <a
                  href={product.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[10px] uppercase tracking-widest text-brand-muted underline underline-offset-2 hover:text-brand-white sm:text-left"
                >
                  View on Instagram
                </a>
              )}
              {message && <p className="text-sm text-brand-muted">{message}</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
