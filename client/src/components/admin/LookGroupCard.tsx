import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { ProductImage } from '@/components/ui/ProductImage'

export interface LookGroupRow {
  key: string
  primaryId: string
  primarySlug: string
  name: string
  description: string
  category: string
  price: number
  tags: string[]
  isActive: boolean
  images: string[]
  slugs: string[]
  productIds: string[]
}

interface LookGroupCardProps {
  group: LookGroupRow
  onEdit: (productId: string) => void
  onMerge?: (key: string) => void
}

export function LookGroupCard({ group, onEdit, onMerge }: LookGroupCardProps) {
  const images = group.images.length > 0 ? group.images : ['']
  const [index, setIndex] = useState(0)
  const hasSlides = images.length > 1

  function prev() {
    setIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  }

  function next() {
    setIndex((i) => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <article className="group overflow-hidden rounded border border-theme-subtle bg-brand-dark/20 text-left transition-colors hover:border-brand-white/30">
      <div className="relative aspect-[3/4] bg-brand-gray">
        <ProductImage
          src={images[index]}
          alt={`${group.name} — shot ${index + 1}`}
          className="h-full w-full"
          containerClassName="h-full w-full"
        />

        {hasSlides && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Previous shot"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Next shot"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === index ? 'bg-white' : 'bg-white/40'
                  }`}
                  aria-label={`Go to shot ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {!group.isActive && (
          <span className="absolute left-2 top-2 rounded bg-red-500/90 px-2 py-0.5 text-[9px] uppercase text-white">
            Inactive
          </span>
        )}
        {group.slugs.length > 1 && (
          <span className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[9px] uppercase text-white">
            {group.slugs.length} shots
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="line-clamp-2 text-[10px] font-semibold uppercase leading-snug">{group.name}</p>
        <p className="mt-1 text-xs font-bold tabular-nums">${group.price.toFixed(2)}</p>
        <p className="mt-0.5 text-[10px] capitalize text-theme-secondary">{group.category}</p>
        {group.tags.length > 0 && (
          <p className="mt-1 line-clamp-1 text-[9px] text-theme-secondary">{group.tags.join(' · ')}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(group.primaryId)}
            className="text-[10px] uppercase tracking-widest hover:underline"
          >
            Edit
          </button>
          {group.slugs.length > 1 && onMerge && (
            <button
              type="button"
              onClick={() => onMerge(group.key)}
              className="text-[10px] uppercase tracking-widest text-theme-secondary hover:text-brand-white"
            >
              Merge slides
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
