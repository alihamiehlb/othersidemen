/**
 * Central image registry — generated from Instagram archive via npm run process-images
 * Last sync: 2026-06-06T15:16:16.968Z
 */

export const IMAGES = {
  hero: {
    model: '/images/hero.webp' as string | null,
    modelMobile: '/images/hero-mobile.webp' as string | null,
    dividerBadge: '/images/logo-badge.png' as string | null,
  },
  brand: {
    logo: '/logo.svg' as string | null,
    favicon: '/favicon.svg' as string | null,
  },
  styleDna: {
    minimal: '/images/style-dna/minimal.webp' as string | null,
    street: '/images/style-dna/street.webp' as string | null,
    creative: '/images/style-dna/creative.webp' as string | null,
    classic: '/images/style-dna/classic.webp' as string | null,
    tech: '/images/style-dna/tech.webp' as string | null,
  },
  outfitBuilder: {
    preview: '/images/outfit-builder/preview.webp' as string | null,
    items: {
      'top-1': '/images/outfit-builder/top-1.webp',
      'top-2': '/images/outfit-builder/top-2.webp',
      'top-3': '/images/outfit-builder/top-3.webp',
      'top-4': '/images/outfit-builder/top-4.webp',
      'bottom-1': '/images/outfit-builder/bottom-1.webp',
      'bottom-2': '/images/outfit-builder/bottom-2.webp',
      'bottom-3': '/images/outfit-builder/bottom-3.webp',
      'bottom-4': '/images/outfit-builder/bottom-4.webp',
      'outer-1': '/images/outfit-builder/outer-1.webp',
      'outer-2': '/images/outfit-builder/outer-2.webp',
      'outer-3': '/images/outfit-builder/outer-3.webp',
      'outer-4': '/images/outfit-builder/outer-4.webp',
      'foot-1': '/images/outfit-builder/foot-1.webp',
      'foot-2': '/images/outfit-builder/foot-2.webp',
      'foot-3': '/images/outfit-builder/foot-3.webp',
      'foot-4': '/images/outfit-builder/foot-4.webp',
    } as Record<string, string | null>,
  },
  lookbook: {
    winterLayers: '/images/lookbook/winter-layers.webp' as string | null,
    cityEssentials: '/images/lookbook/city-essentials.webp' as string | null,
    offDutyLooks: '/images/lookbook/off-duty.webp' as string | null,
    eveningRefined: '/images/lookbook/evening-refined.webp' as string | null,
    weekendEscape: '/images/lookbook/weekend-escape.webp' as string | null,
  },
  products: {
    p1: "/images/products/utility-puffer-jacket.webp",
    p2: "/images/products/oversized-hoodie.webp",
    p3: "/images/products/cargo-pants.webp",
    p4: "/images/products/high-top-sneakers.webp",
    p5: "/images/products/bomber-jacket.webp",
    p6: "/images/products/crossbody-bag.webp"
} as Record<string, string | null>,
} as const

export type ImageKey = keyof typeof IMAGES
