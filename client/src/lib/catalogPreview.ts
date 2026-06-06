import type { ProductCardData } from '@/components/ui/ProductCard'

export interface CatalogPreview {
  generatedAt: string
  total?: number
  looks: ProductCardData[]
  styleDna?: ProductCardData[]
  newIn?: ProductCardData[]
  featured?: ProductCardData[]
  all?: ProductCardData[]
  lookGroups?: Record<string, {
    key: string
    primarySlug: string
    name: string
    description?: string
    instagramUrl?: string
    images: string[]
    slugs: string[]
  }>
}

let cache: CatalogPreview | null = null

export async function loadCatalogPreview(): Promise<CatalogPreview | null> {
  if (cache) return cache
  try {
    const res = await fetch('/catalog-preview.json', { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    cache = (await res.json()) as CatalogPreview
    return cache
  } catch {
    return null
  }
}

function productPool(preview: CatalogPreview, category: string | undefined): ProductCardData[] {
  const all = preview.all ?? preview.looks
  if (!category || category === 'all') return all
  return all.filter((p) => p.category === category)
}

export function previewProducts(
  preview: CatalogPreview | null,
  category: string | undefined,
  limit: number,
  page = 1,
): ProductCardData[] {
  if (!preview) return []
  const pool = productPool(preview, category)
  const start = (page - 1) * limit
  return pool.slice(start, start + limit)
}

export function previewProductTotal(
  preview: CatalogPreview | null,
  category: string | undefined,
): number {
  if (!preview) return 0
  return productPool(preview, category).length
}
