import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useProducts } from '@/hooks/useProducts'

export function LookbookSection() {
  const { products, loading, error } = useProducts('looks', 8, { previewSection: 'looks', skip: 0 })

  return (
    <section id="lookbook" className="section-shell section-surface-dark" aria-labelledby="lookbook-heading">
      <div className="store-container">
        <SectionHeader
          id="lookbook-heading"
          eyebrow="Lookbook"
          title="Real fits. Real people. Real life."
          description="Swipe through looks — tap any card for gallery, sizes, and WhatsApp order."
          linkTo="/shop?category=looks"
          linkLabel="View All Looks"
        />

        {loading && <p className="text-sm text-theme-secondary">Loading lookbook...</p>}
        {error && !loading && <p className="text-sm text-red-400">Could not load lookbook.</p>}

        <div className="scroll-fade-x -mx-1 flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-scroll-x sm:pb-4">
          {products.map((product, index) => (
            <div key={product._id} className="snap-item w-[72vw] shrink-0 sm:w-[240px]">
              <ProductCard product={product as ProductCardData} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
