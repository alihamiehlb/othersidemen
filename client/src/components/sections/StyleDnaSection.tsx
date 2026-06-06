import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard'
import { ProductModal } from '@/components/ui/ProductModal'
import { useProductModal } from '@/hooks/useProductModal'
import { useProducts } from '@/hooks/useProducts'

const STYLE_LABELS: Record<string, { title: string; description: string; category: string }> = {
  minimal: { title: 'MINIMAL', description: 'Clean. Simple. Timeless.', category: 'tops' },
  street: { title: 'STREET', description: 'Bold. Urban. Effortless.', category: 'looks' },
  creative: { title: 'CREATIVE', description: 'Unique. Expressive. You.', category: 'accessories' },
  classic: { title: 'CLASSIC', description: 'Sharp. Refined. Always.', category: 'outerwear' },
  tech: { title: 'TECH', description: 'Functional. Modern. Futuristic.', category: 'footwear' },
}

export function StyleDnaSection() {
  const { products: looksProducts, loading, error } = useProducts('looks', 5)
  const { selected, loading: modalLoading, openProduct, closeProduct } = useProductModal()

  const cards = Object.keys(STYLE_LABELS).map((id, index) => ({
    id,
    label: STYLE_LABELS[id],
    product: looksProducts[index] as ProductCardData | undefined,
  }))

  return (
    <section className="bg-brand-black px-6 py-20 lg:px-10" aria-labelledby="style-dna-heading">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-brand-muted">Style DNA</p>
            <h2 id="style-dna-heading" className="text-3xl font-black uppercase tracking-tight lg:text-4xl">
              What&apos;s your vibe?
            </h2>
            <p className="mt-2 max-w-md text-sm text-brand-muted">
              Tap a look to shop — add to bag or order on WhatsApp.
            </p>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-white transition-colors hover:text-brand-light">
            Shop Collection
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading && <p className="text-sm text-brand-muted">Loading looks...</p>}
        {error && !loading && <p className="text-sm text-red-400">Could not load products.</p>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
          {cards.map((card, index) =>
            card.product ? (
              <ProductCard
                key={card.id}
                product={card.product}
                index={index}
                onSelect={(p) => void openProduct(p)}
              />
            ) : (
              <Link
                key={card.id}
                to={`/shop?category=${card.label.category}`}
                className="group relative flex overflow-hidden rounded-lg border border-theme-subtle bg-brand-gray"
                style={{ aspectRatio: '3/5' }}
              >
                <div className="flex flex-1 flex-col justify-end p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest">{card.label.title}</h3>
                  <p className="mt-1 text-[10px] text-brand-muted">{card.label.description}</p>
                </div>
              </Link>
            ),
          )}
        </div>
      </div>

      <ProductModal product={selected} loading={modalLoading} onClose={closeProduct} />
    </section>
  )
}
