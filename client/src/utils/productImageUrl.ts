import { SITE_URL } from '@/config/site'

const CDN_ORIGIN = (import.meta.env.VITE_CDN_URL as string | undefined)?.replace(/\/$/, '') ?? ''

/** Resolve catalog image paths to a URL that actually serves WebP (not SPA fallback). */
export function resolveProductImageSrc(src?: string | null): string | undefined {
  if (!src) return undefined
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  const path = src.startsWith('/') ? src : `/${src}`
  if (CDN_ORIGIN) return `${CDN_ORIGIN}${path}`
  return path
}

/** Absolute URL for Open Graph / JSON-LD. */
export function absoluteAssetUrl(src?: string | null): string {
  const resolved = resolveProductImageSrc(src)
  if (!resolved) return `${SITE_URL}/images/hero.webp`
  if (resolved.startsWith('http')) return resolved
  return `${SITE_URL}${resolved}`
}
