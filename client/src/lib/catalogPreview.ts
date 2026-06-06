import type { ProductCardData } from '@/components/ui/ProductCard'

export interface CatalogPreview {
  looks: ProductCardData[]
  styleDna: ProductCardData[]
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

export function previewProducts(
  preview: CatalogPreview | null,
  category: string | undefined,
  limit: number,
): ProductCardData[] {
  if (!preview) return []
  const pool =
    !category || category === 'all' || category === 'looks'
      ? preview.looks
      : preview.looks.filter((p) => p.category === category)
  return pool.slice(0, limit)
}
