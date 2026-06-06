/**
 * Sync client/src/config/images.ts from scripts/image-manifest.json
 * Usage: node scripts/sync-images-config.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MANIFEST = path.join(ROOT, 'scripts', 'image-manifest.json')
const OUT = path.join(ROOT, 'client', 'src', 'config', 'images.ts')

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))

const PRODUCT_KEY_ORDER = [
  'utility-puffer-jacket',
  'oversized-hoodie',
  'cargo-pants',
  'high-top-sneakers',
  'bomber-jacket',
  'crossbody-bag',
]

const products = Object.fromEntries(
  PRODUCT_KEY_ORDER.map((slug, i) => {
    const meta = manifest.products?.[slug]
    return [`p${i + 1}`, meta?.path ?? null]
  }).filter(([, path]) => path),
)

const lookbook = Object.fromEntries(
  Object.entries(manifest.lookbook ?? {}).map(([key, meta]) => [key, meta.path]),
)

const styleDna = Object.fromEntries(
  Object.entries(manifest.styleDna ?? {}).map(([key, meta]) => [key, meta.path]),
)

const heroPath = manifest.hero?.path ?? '/images/hero.webp'

const content = `/**
 * Central image registry — generated from Instagram archive via npm run process-images
 * Last sync: ${manifest.generatedAt ?? 'unknown'}
 */

export const IMAGES = {
  hero: {
    model: '${heroPath}' as string | null,
    modelMobile: '/images/hero-mobile.webp' as string | null,
    dividerBadge: '/images/logo-badge.png' as string | null,
  },
  brand: {
    logo: '/logo.svg' as string | null,
    favicon: '/favicon.svg' as string | null,
  },
  styleDna: {
    minimal: ${styleDna.minimal ? `'${styleDna.minimal}'` : 'null'} as string | null,
    street: ${styleDna.street ? `'${styleDna.street}'` : 'null'} as string | null,
    creative: ${styleDna.creative ? `'${styleDna.creative}'` : 'null'} as string | null,
    classic: ${styleDna.classic ? `'${styleDna.classic}'` : 'null'} as string | null,
    tech: ${styleDna.tech ? `'${styleDna.tech}'` : 'null'} as string | null,
  },
  outfitBuilder: {
    preview: ${manifest.outfitBuilder?.preview?.path ? `'${manifest.outfitBuilder.preview.path}'` : 'null'} as string | null,
    items: {
${Object.entries(manifest.outfitBuilder ?? {})
  .filter(([key]) => key !== 'preview')
  .map(([key, meta]) => `      '${key}': '${meta.path}',`)
  .join('\n')}
    } as Record<string, string | null>,
  },
  lookbook: {
    winterLayers: ${lookbook.winterLayers ? `'${lookbook.winterLayers}'` : 'null'} as string | null,
    cityEssentials: ${lookbook.cityEssentials ? `'${lookbook.cityEssentials}'` : 'null'} as string | null,
    offDutyLooks: ${lookbook.offDutyLooks ? `'${lookbook.offDutyLooks}'` : 'null'} as string | null,
    eveningRefined: ${lookbook.eveningRefined ? `'${lookbook.eveningRefined}'` : 'null'} as string | null,
    weekendEscape: ${lookbook.weekendEscape ? `'${lookbook.weekendEscape}'` : 'null'} as string | null,
  },
  products: ${JSON.stringify(products, null, 4).replace(/"([^"]+)":/g, '$1:')} as Record<string, string | null>,
} as const

export type ImageKey = keyof typeof IMAGES
`

fs.writeFileSync(OUT, content)
console.log(`[sync] Updated ${OUT}`)
