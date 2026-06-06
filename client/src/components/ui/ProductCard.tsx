import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MouseEvent } from 'react'
import { ProductImage } from '@/components/ui/ProductImage'
import { displayProductName } from '@/lib/productDisplay'

export interface ProductCardData {
  _id: string
  name: string
  slug: string
  price: number
  images: string[]
  category?: string
  description?: string
  sizes?: string[]
  colors?: string[]
  instagramUrl?: string
}

interface ProductCardProps {
  product: ProductCardData
  index?: number
  showWishlist?: boolean
  onSelect?: (product: ProductCardData) => void
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export function ProductCard({ product, index = 0, showWishlist = false, onSelect }: ProductCardProps) {
  const imageBlock = (
    <div
      className="product-card-image relative mb-3 overflow-hidden bg-brand-gray shadow-sm"
      style={{ aspectRatio: '3/4' }}
    >
      {product.images[0] ? (
        <ProductImage
          src={product.images[0]}
          alt={displayProductName(product.name)}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03] group-active:scale-[0.99]"
          containerClassName="h-full w-full"
        />
      ) : (
        <ProductImage alt={displayProductName(product.name)} containerClassName="h-full w-full" />
      )}
      {product.category && (
        <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
          {product.category}
        </span>
      )}
      {showWishlist && (
        <button
          type="button"
          aria-label={`Add ${product.name} to wishlist`}
          onClick={(e) => e.preventDefault()}
          className="touch-target absolute right-2 top-2 inline-flex items-center justify-center rounded-full bg-black/35 text-brand-white/80 backdrop-blur-sm transition-colors hover:text-brand-white"
        >
          <Heart size={15} strokeWidth={1.5} />
        </button>
      )}
    </div>
  )

  const meta = (
    <>
      <h3 className="line-clamp-2 text-[10px] font-semibold uppercase leading-snug tracking-[0.14em] transition-colors group-hover:text-brand-light sm:text-[11px]">
        {displayProductName(product.name)}
      </h3>
      <p className="mt-1.5 text-sm font-medium tabular-nums text-brand-muted">{formatPrice(product.price)}</p>
    </>
  )

  return (
    <Link
      to={`/product/${product.slug}`}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (onSelect) {
          e.preventDefault()
          onSelect(product)
        }
      }}
      className="product-card group block w-full text-left"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <article>
        {imageBlock}
        {meta}
      </article>
    </Link>
  )
}
