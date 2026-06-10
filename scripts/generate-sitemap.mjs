/**
 * Generates client/public/sitemap.xml from static routes + catalog manifest.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_URL = process.env.SITE_URL ?? 'https://twoside-store.pages.dev'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const today = new Date().toISOString().slice(0, 10)

const staticRoutes = [
  { path: '/', changefreq: 'daily', priority: '1.0', lastmod: today },
  { path: '/shop', changefreq: 'daily', priority: '0.9', lastmod: today },
  { path: '/about', changefreq: 'monthly', priority: '0.5', lastmod: today },
  { path: '/contact', changefreq: 'monthly', priority: '0.5', lastmod: today },
  { path: '/faq', changefreq: 'monthly', priority: '0.5', lastmod: today },
  { path: '/shipping', changefreq: 'monthly', priority: '0.4', lastmod: today },
  { path: '/returns', changefreq: 'monthly', priority: '0.4', lastmod: today },
  { path: '/payment', changefreq: 'monthly', priority: '0.4', lastmod: today },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3', lastmod: today },
  { path: '/terms', changefreq: 'yearly', priority: '0.3', lastmod: today },
  { path: '/cookies', changefreq: 'yearly', priority: '0.3', lastmod: today },
  { path: '/security-policy', changefreq: 'yearly', priority: '0.3', lastmod: today },
]

const manifest = JSON.parse(readFileSync(join(root, 'scripts/catalog-manifest.json'), 'utf8'))
const catalogLastmod = manifest.generatedAt
  ? new Date(manifest.generatedAt).toISOString().slice(0, 10)
  : today

const productRoutes = manifest.items.map((item) => ({
  path: `/product/${item.slug}`,
  changefreq: 'weekly',
  priority: '0.7',
  lastmod: catalogLastmod,
}))

const categoryRoutes = Object.keys(manifest.categoryCounts ?? {}).map((category) => ({
  path: `/shop?category=${category}`,
  changefreq: 'weekly',
  priority: '0.8',
  lastmod: catalogLastmod,
}))

const urls = [...staticRoutes, ...categoryRoutes, ...productRoutes]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${SITE_URL}${u.path}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync(join(root, 'client/public/sitemap.xml'), xml, 'utf8')
console.log(
  `sitemap.xml: ${urls.length} URLs (${productRoutes.length} products, ${categoryRoutes.length} categories)`,
)
