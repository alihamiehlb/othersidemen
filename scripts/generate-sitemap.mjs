/**
 * Generates client/public/sitemap.xml from static routes + catalog manifest.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_URL = process.env.SITE_URL ?? 'https://twoside-store.pages.dev'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const staticRoutes = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/faq', changefreq: 'monthly', priority: '0.4' },
  { path: '/shipping', changefreq: 'monthly', priority: '0.4' },
  { path: '/returns', changefreq: 'monthly', priority: '0.4' },
  { path: '/payment', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/cookies', changefreq: 'yearly', priority: '0.3' },
  { path: '/security-policy', changefreq: 'yearly', priority: '0.3' },
]

const manifest = JSON.parse(readFileSync(join(root, 'scripts/catalog-manifest.json'), 'utf8'))
const productRoutes = manifest.items.map((item) => ({
  path: `/product/${item.slug}`,
  changefreq: 'weekly',
  priority: '0.7',
}))

const urls = [...staticRoutes, ...productRoutes]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${SITE_URL}${u.path}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync(join(root, 'client/public/sitemap.xml'), xml, 'utf8')
console.log(`sitemap.xml: ${urls.length} URLs (${productRoutes.length} products)`)
