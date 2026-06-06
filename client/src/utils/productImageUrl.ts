import { SITE_URL } from '@/config/site'

const CDN_ORIGIN = (import.meta.env.VITE_CDN_URL as string | undefined)?.replace(/\/$/, '') ?? ''

/** Preview deployment that still hosts the full catalog when local sync misses files. */
export const CATALOG_IMAGE_CDN = 'https://03fee126.twoside-store.pages.dev'

export const IMAGE_FALLBACK_ORIGINS = [
  CDN_ORIGIN,
  CATALOG_IMAGE_CDN,
].filter(Boolean) as string[]

function catalogImageOrigins(): string[] {
  // In production, prefer the full catalog CDN first — Pages SPA fallback serves HTML for missing /images/* files.
  if (import.meta.env.PROD) {
    return [CATALOG_IMAGE_CDN, '', ...IMAGE_FALLBACK_ORIGINS.filter((o) => o !== CATALOG_IMAGE_CDN)]
  }
  return ['', ...IMAGE_FALLBACK_ORIGINS]
}

/** Resolve catalog image paths to a URL that actually serves WebP (not SPA fallback). */
export function resolveProductImageSrc(
  src?: string | null,
  originIndex = 0,
): string | undefined {
  if (!src) return undefined
  if (src.startsWith('http://') || src.startsWith('https://')) return src

  const path = src.startsWith('/') ? src : `/${src}`
  const origins = path.startsWith('/images/catalog/') ? catalogImageOrigins() : ['', ...IMAGE_FALLBACK_ORIGINS]
  const origin = origins[Math.min(originIndex, origins.length - 1)] ?? ''
  if (!origin) return path
  return `${origin}${path}`
}

export function productImageOriginCount(src?: string | null): number {
  if (!src || src.startsWith('http')) return 1
  const path = src.startsWith('/') ? src : `/${src}`
  const origins = path.startsWith('/images/catalog/') ? catalogImageOrigins() : ['', ...IMAGE_FALLBACK_ORIGINS]
  return origins.length
}

/** Absolute URL for Open Graph / JSON-LD. */
export function absoluteAssetUrl(src?: string | null): string {
  const resolved = resolveProductImageSrc(src)
  if (!resolved) return `${SITE_URL}/images/hero.webp`
  if (resolved.startsWith('http')) return resolved
  return `${SITE_URL}${resolved}`
}
