import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ProductCard, type ProductCardData } from '@/components/ui/ProductCard'
import { useProducts } from '@/hooks/useProducts'

export function LookbookSection() {
  const { products, loading, error } = useProducts('looks', 8, { previewSection: 'looks', skip: 0 })

  return (
    <section id="lookbook" className="bg-brand-black px-6 py-20 lg:px-10" aria-labelledby="lookbook-heading">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-brand-muted">Lookbook</p>
            <h2 id="lookbook-heading" className="text-3xl font-black uppercase tracking-tight lg:text-4xl">
              Real fits. Real people. Real life.
            </h2>
            <p className="mt-2 max-w-md text-sm text-brand-muted">
              Tap a look to open the full product page — gallery, sizes, and WhatsApp order.
            </p>
          </div>
          <Link to="/shop?category=looks" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-white transition-colors hover:text-brand-light">
            View All Looks
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading && <p className="text-sm text-brand-muted">Loading lookbook...</p>}
        {error && !loading && <p className="text-sm text-red-400">Could not load lookbook.</p>}

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
          {products.map((product, index) => (
            <div key={product._id} className="w-[220px] shrink-0 sm:w-[240px]">
              <ProductCard product={product as ProductCardData} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
