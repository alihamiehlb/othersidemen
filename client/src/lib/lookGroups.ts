import type { ProductCardData } from '@/components/ui/ProductCard'
import { loadCatalogPreview, type CatalogPreview } from '@/lib/catalogPreview'

export function lookGroupKey(slug: string): string {
  const m = slug.match(/^os-(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : slug
}

export function dedupeByLookGroup(products: ProductCardData[]): ProductCardData[] {
  const seen = new Set<string>()
  return products.filter((p) => {
    const key = lookGroupKey(p.slug)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export interface LookGroup {
  key: string
  primarySlug: string
  name: string
  description?: string
  instagramUrl?: string
  images: string[]
  slugs: string[]
}

export async function loadLookGroup(slug: string): Promise<LookGroup | null> {
  const preview = await loadCatalogPreview()
  if (!preview?.lookGroups) return null
  const key = lookGroupKey(slug)
  return preview.lookGroups[key] ?? null
}

export function previewSection(
  preview: CatalogPreview | null,
  section: 'looks' | 'styleDna' | 'newIn' | 'featured',
): ProductCardData[] {
  if (!preview) return []
  return preview[section] ?? []
}
