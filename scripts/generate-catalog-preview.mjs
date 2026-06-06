/**
 * Builds client/public/catalog-preview.json with deduplicated look groups per homepage section.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(root, 'scripts/catalog-manifest.json'), 'utf8'))

const mapItem = ({ _id, slug, name, price, images, category, description, sizes, colors, instagramUrl }) => ({
  _id: _id ?? slug,
  slug,
  name,
  price,
  images,
  category,
  description,
  sizes,
  colors,
  instagramUrl,
})

function lookGroupKey(slug) {
  const m = String(slug).match(/^os-(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : slug
}

function dedupeByLookGroup(items) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const key = lookGroupKey(item.slug)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function pickFromPool(pool, start, limit) {
  return pool.slice(start, start + limit).map(mapItem)
}

function pickByCategories(categories, itemsByCategory) {
  return categories
    .map((cat) => itemsByCategory[cat]?.[0])
    .filter(Boolean)
    .map(mapItem)
}

const allItems = manifest.items.map(mapItem)
const allLooks = dedupeByLookGroup(manifest.items.filter((i) => i.category === 'looks'))

const byCategory = {}
for (const item of manifest.items) {
  if (!byCategory[item.category]) byCategory[item.category] = dedupeByLookGroup(manifest.items.filter((i) => i.category === item.category))
}

/** Gallery images grouped by look date (multiple shots of same outfit) */
const lookGroups = {}
for (const item of manifest.items.filter((i) => i.category === 'looks')) {
  const key = lookGroupKey(item.slug)
  if (!lookGroups[key]) {
    lookGroups[key] = {
      key,
      primarySlug: item.slug,
      name: item.name,
      description: item.description,
      instagramUrl: item.instagramUrl,
      images: [],
      slugs: [],
    }
  }
  lookGroups[key].slugs.push(item.slug)
  for (const img of item.images ?? []) {
    if (!lookGroups[key].images.includes(img)) lookGroups[key].images.push(img)
  }
}

const preview = {
  generatedAt: new Date().toISOString(),
  total: manifest.items.length,
  looks: pickFromPool(allLooks, 0, 10),
  styleDna: pickByCategories(['looks', 'outerwear', 'tops', 'footwear', 'accessories'], byCategory),
  newIn: pickFromPool(allLooks, 10, 8),
  featured: pickFromPool(allLooks, 18, 6),
  all: allItems,
  lookGroups,
}

writeFileSync(join(root, 'client/public/catalog-preview.json'), JSON.stringify(preview), 'utf8')

console.log(
  `catalog-preview.json: ${preview.looks.length} looks, ${preview.styleDna.length} style, ${preview.newIn.length} new in, ${Object.keys(lookGroups).length} look groups`,
)
