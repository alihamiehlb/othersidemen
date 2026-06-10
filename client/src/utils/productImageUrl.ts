import { SITE_URL } from '@/config/site'

/** Primary image CDN — Cloudflare R2 public URL (set VITE_CDN_URL at build time). */
const CDN_ORIGIN = (import.meta.env.VITE_CDN_URL as string | undefined)?.replace(/\/$/, '') ?? ''

/** Legacy Pages deploy that hosts catalog when R2/CDN is unavailable. */
export const CATALOG_IMAGE_CDN = 'https://03fee126.twoside-store.pages.dev'

export const IMAGE_FALLBACK_ORIGINS = [
  CDN_ORIGIN,
  CATALOG_IMAGE_CDN,
  '',
].filter((v, i, arr) => v !== '' || i === arr.length - 1) as string[]

function catalogImageOrigins(): string[] {
  if (CDN_ORIGIN) {
    return [CDN_ORIGIN, CATALOG_IMAGE_CDN, '']
  }
  if (import.meta.env.PROD) {
    return [CATALOG_IMAGE_CDN, '']
  }
  return ['', CATALOG_IMAGE_CDN]
}

/** Resolve catalog image paths to a URL that serves WebP (R2 → legacy Pages CDN → same-origin). */
export function resolveProductImageSrc(
  src?: string | null,
  originIndex = 0,
): string | undefined {
  if (!src) return undefined
  if (src.startsWith('http://') || src.startsWith('https://')) return src

  const path = src.startsWith('/') ? src : `/${src}`
  const origins = path.startsWith('/images/') ? catalogImageOrigins() : ['', ...IMAGE_FALLBACK_ORIGINS.filter(Boolean)]
  const origin = origins[Math.min(originIndex, origins.length - 1)] ?? ''
  if (!origin) return path
  return `${origin}${path}`
}

export function productImageOriginCount(src?: string | null): number {
  if (!src || src.startsWith('http')) return 1
  const path = src.startsWith('/') ? src : `/${src}`
  const origins = path.startsWith('/images/') ? catalogImageOrigins() : ['', ...IMAGE_FALLBACK_ORIGINS.filter(Boolean)]
  return origins.length
}

/** Absolute URL for Open Graph / JSON-LD. */
export function absoluteAssetUrl(src?: string | null): string {
  const resolved = resolveProductImageSrc(src)
  if (!resolved) return `${SITE_URL}/images/hero.webp`
  if (resolved.startsWith('http')) return resolved
  return `${SITE_URL}${resolved}`
}
