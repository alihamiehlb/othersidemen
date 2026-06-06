import { ArrowRight } from 'lucide-react'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import { Button } from '@/components/ui/Button'
import { OUTFIT_CATEGORIES } from '@/data/mockData'
import { useOutfitBuilder } from '@/hooks/useOutfitBuilder'
import type { OutfitView } from '@/types'

const VIEW_OPTIONS: OutfitView[] = ['front', 'side', 'back']

export function OutfitBuilderSection() {
  const {
    activeCategory,
    setActiveCategory,
    activeView,
    setActiveView,
    selection,
    categoryItems,
    selectItem,
    selectedCount,
    previewSrc,
  } = useOutfitBuilder()

  return (
    <section
      id="outfit-builder"
      className="bg-brand-dark px-6 py-20 lg:px-10"
      aria-labelledby="outfit-builder-heading"
    >
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-brand-muted">
              Outfit Builder
            </p>
            <h2 id="outfit-builder-heading" className="text-3xl font-black uppercase tracking-tight lg:text-4xl">
              Build it. Wear it. Own it.
            </h2>
          </div>
          <a
            href="#outfit-builder"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-white transition-colors hover:text-brand-light"
          >
            Start Building
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Builder layout */}
        <div className="grid gap-6 lg:grid-cols-[140px_1fr_320px]">
          {/* Category sidebar */}
          <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1" aria-label="Outfit categories">
            {OUTFIT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  shrink-0 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest transition-colors
                  ${activeCategory === cat.id
                    ? 'bg-brand-white text-brand-black'
                    : 'text-brand-muted hover:text-brand-white'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Preview */}
          <div className="relative overflow-hidden rounded-lg bg-brand-gray" style={{ aspectRatio: '3/4', minHeight: '400px' }}>
            <ImagePlaceholder
              src={previewSrc}
              imageKey={previewSrc ? undefined : 'outfitBuilder.preview'}
              alt={`Outfit preview — ${activeView} view`}
              label={previewSrc ? undefined : `Preview — ${activeView}`}
            />
            {selectedCount > 0 && (
              <div className="absolute top-4 right-4 rounded-full bg-black/70 px-3 py-1 text-[10px] font-medium uppercase tracking-widest">
                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Item grid */}
          <div className="grid grid-cols-4 gap-2">
            {categoryItems.map((item) => {
              const isSelected = selection[activeCategory] === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectItem(item.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select ${item.name}`}
                  className={`
                    relative overflow-hidden rounded-md transition-all
                    ${isSelected ? 'ring-2 ring-brand-white' : 'ring-1 ring-white/10 hover:ring-white/30'}
                  `}
                  style={{ aspectRatio: '1' }}
                >
                  <ImagePlaceholder
                    imageKey={item.imageKey}
                    alt={item.name}
                    label={item.name}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2" role="group" aria-label="View angle">
            {VIEW_OPTIONS.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`
                  px-5 py-2 text-[10px] font-semibold uppercase tracking-widest transition-colors
                  ${activeView === view
                    ? 'bg-brand-white text-brand-black'
                    : 'border border-white/20 text-brand-muted hover:text-brand-white'
                  }
                `}
              >
                {view}
              </button>
            ))}
          </div>
          <Button variant="solid" className="ml-auto">
            Save Outfit
          </Button>
        </div>
      </div>
    </section>
  )
}
