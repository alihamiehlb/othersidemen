import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard'
import { useProducts } from '@/hooks/useProducts'
import { useTheme } from '@/contexts/ThemeContext'

const STYLE_LABELS: Record<string, { title: string; description: string }> = {
  minimal: { title: 'MINIMAL', description: 'Clean. Simple. Timeless.' },
  street: { title: 'STREET', description: 'Bold. Urban. Effortless.' },
  creative: { title: 'CREATIVE', description: 'Unique. Expressive. You.' },
  classic: { title: 'CLASSIC', description: 'Sharp. Refined. Always.' },
  tech: { title: 'TECH', description: 'Functional. Modern. Futuristic.' },
}

export function StyleDnaSection() {
  const { products, loading, error } = useProducts(undefined, 5, { previewSection: 'styleDna' })
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const cards = Object.keys(STYLE_LABELS).map((id, index) => ({
    id,
    label: STYLE_LABELS[id],
    product: products[index] as ProductCardData | undefined,
  }))

  return (
    <section
      className={`px-4 py-16 sm:px-6 lg:px-10 lg:py-20 ${isLight ? 'bg-neutral-50' : 'bg-brand-black'}`}
      aria-labelledby="style-dna-heading"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-brand-muted">Style DNA</p>
            <h2 id="style-dna-heading" className="text-3xl font-black uppercase tracking-tight lg:text-4xl">
              What&apos;s your vibe?
            </h2>
            <p className="mt-2 max-w-md text-sm text-theme-secondary">
              One pick per category — open any card for the full look page.
            </p>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-white transition-colors hover:text-brand-light">
            Shop Collection
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading && <p className="text-sm text-brand-muted">Loading looks...</p>}
        {error && !loading && <p className="text-sm text-red-400">Could not load products.</p>}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-5">
          {cards.map((card, index) =>
            card.product ? (
              <ProductCard key={card.id} product={card.product} index={index} />
            ) : (
              <Link
                key={card.id}
                to="/shop"
                className={`group relative flex overflow-hidden rounded-2xl border bg-brand-gray ${
                  isLight ? 'border-black/10 shadow-sm' : 'border-theme-subtle'
                }`}
                style={{ aspectRatio: '3/5' }}
              >
                <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-t from-white via-white/50 to-transparent' : 'bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent'}`} />
                <div className="relative z-10 flex flex-1 flex-col justify-end p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest">{card.label.title}</h3>
                  <p className="mt-1 text-[10px] text-brand-muted">{card.label.description}</p>
                </div>
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  )
}
