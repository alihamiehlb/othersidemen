import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
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

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const rail = document.getElementById('style-dna-rail')
    if (!rail) return
    const cardWidth = rail.querySelector('.snap-item')?.clientWidth ?? 280
    rail.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' })
  }, [])

  const [canScroll, setCanScroll] = useState(false)
  useEffect(() => {
    const rail = document.getElementById('style-dna-rail')
    if (!rail) return
    const update = () => setCanScroll(rail.scrollWidth > rail.clientWidth + 8)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [cards.length, loading])

  return (
    <section
      className={`section-shell ${isLight ? 'section-surface-light' : 'section-surface-dark'}`}
      aria-labelledby="style-dna-heading"
    >
      <div className="store-container">
        <SectionHeader
          id="style-dna-heading"
          eyebrow="Style DNA"
          title="What's your vibe?"
          description="One pick per category — open any card for the full look page."
          linkTo="/shop"
          linkLabel="Shop Collection"
        />

        {loading && <p className="text-sm text-theme-secondary">Loading looks...</p>}
        {error && !loading && <p className="text-sm text-red-400">Could not load products.</p>}

        <div className="relative">
          {canScroll && (
            <div className="mb-3 flex justify-end gap-2 sm:hidden">
              <button type="button" onClick={() => scrollByCard(-1)} className="touch-target rounded-full border border-theme-subtle px-3 text-xs uppercase tracking-widest">
                Prev
              </button>
              <button type="button" onClick={() => scrollByCard(1)} className="touch-target rounded-full border border-theme-subtle px-3 text-xs uppercase tracking-widest">
                Next
              </button>
            </div>
          )}

          <div
            id="style-dna-rail"
            className="scroll-fade-x -mx-1 flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-scroll-x sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 md:grid-cols-5 md:gap-5"
          >
            {cards.map((card, index) => (
              <div key={card.id} className="snap-item w-[78vw] shrink-0 sm:w-auto sm:shrink">
                {card.product ? (
                  <ProductCard product={card.product} index={index} />
                ) : (
                  <Link
                    to="/shop"
                    className={`group relative flex overflow-hidden rounded-2xl border bg-brand-gray ${
                      isLight ? 'border-black/10 shadow-sm' : 'border-theme-subtle'
                    }`}
                    style={{ aspectRatio: '3/4' }}
                  >
                    <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-t from-white via-white/50 to-transparent' : 'bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent'}`} />
                    <div className="relative z-10 flex flex-1 flex-col justify-end p-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest">{card.label.title}</h3>
                      <p className="mt-1 text-[10px] text-theme-secondary">{card.label.description}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest">
                        Explore
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
