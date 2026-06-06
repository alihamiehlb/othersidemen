import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/branding/LoadingScreen'
import { ErrorScreen } from '@/components/branding/ErrorScreen'
import { ProductImage } from '@/components/ui/ProductImage'
import { SeoHead, buildProductJsonLd } from '@/components/seo/SeoHead'
import { useCart } from '@/contexts/CartContext'
import { api } from '@/lib/api'
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
  const [loading, setLoading] = useState(true)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!slug) return
    api<Product>(`/api/products/${slug}`)
      .then((res) => {
        if (res.success && res.data) {
          setProduct(res.data)
          setSize(defaultSizes(res.data.category, res.data.sizes)[0] ?? 'One Size')
          setColor(defaultColors(res.data.category, res.data.colors)[0] ?? 'As shown')
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <LoadingScreen message="Loading product" />
  if (!product) return <ErrorScreen title="Product not found" message="This item may no longer be available." />

  const title = displayProductName(product.name)
  const description = displayProductDescription(product.description)
  const sizes = defaultSizes(product.category, product.sizes)
  const colors = defaultColors(product.category, product.colors)

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
        ogImage={product.images[0] ?? '/images/hero.webp'}
        jsonLd={buildProductJsonLd({
          name: title,
          slug: product.slug,
          description,
          price: product.price,
          images: product.images,
          category: product.category,
        })}
      />
    <div className="page-enter mx-auto grid max-w-[1200px] gap-10 px-6 py-16 lg:grid-cols-2 lg:px-10">
      <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg bg-brand-gray lg:min-h-[560px]">
        <ProductImage
          src={product.images[0]}
          alt={title}
          fit="contain"
          className="max-h-[70vh] w-full"
          containerClassName="flex h-full min-h-[420px] w-full items-center justify-center"
        />
      </div>

      <div className="flex flex-col justify-center">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-brand-muted">
          {product.category ? `${product.category} — Men` : "Men's"}
        </p>
        <h1 className="mb-4 text-2xl font-black uppercase tracking-tight lg:text-3xl">{title}</h1>
        <p className="mb-6 text-xl tabular-nums">${product.price.toFixed(2)}</p>
        {description && <p className="mb-8 text-sm leading-relaxed text-brand-muted">{description}</p>}

        <div className="mb-6">
          <p className="mb-2 text-[10px] uppercase tracking-widest text-brand-muted">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`px-4 py-2 text-xs font-semibold uppercase ${size === s ? 'bg-brand-white text-brand-black' : 'border border-white/20'}`}
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
                className={`px-4 py-2 text-xs font-semibold uppercase ${color === c ? 'bg-brand-white text-brand-black' : 'border border-white/20'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <Button variant="solid" onClick={handleAdd} disabled={adding}>
          {adding ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden />
              Adding…
            </>
          ) : (
            'Add to Bag'
          )}
        </Button>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center justify-center gap-2 border border-[#25D366]/40 bg-[#25D366]/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#25D366] hover:bg-[#25D366]/20"
          >
            <MessageCircle size={16} />
            Order on WhatsApp
          </a>
        )}
        {message && <p className="mt-4 text-sm text-brand-muted">{message}</p>}
      </div>
    </div>
    </>
  )
}
