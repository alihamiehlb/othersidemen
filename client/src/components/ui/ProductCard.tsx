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
      className="product-card-image relative mb-3 overflow-hidden rounded-2xl bg-brand-gray"
      style={{ aspectRatio: '3/4' }}
    >
      {product.images[0] ? (
        <ProductImage
          src={product.images[0]}
          alt={displayProductName(product.name)}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105 group-active:scale-[0.98]"
          containerClassName="h-full w-full"
        />
      ) : (
        <ProductImage alt={displayProductName(product.name)} containerClassName="h-full w-full" />
      )}
      {showWishlist && (
        <button
          type="button"
          aria-label={`Add ${product.name} to wishlist`}
          onClick={(e) => e.preventDefault()}
          className="absolute top-3 right-3 text-brand-white/60 transition-colors hover:text-brand-white"
        >
          <Heart size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
  )

  const meta = (
    <>
      {product.category && (
        <p className="mb-1 text-[9px] uppercase tracking-[0.2em] text-brand-muted">{product.category}</p>
      )}
      <h3 className="line-clamp-2 text-[10px] font-semibold uppercase tracking-widest transition-colors group-hover:text-brand-light">
        {displayProductName(product.name)}
      </h3>
      <p className="mt-1 text-sm text-brand-muted">{formatPrice(product.price)}</p>
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
