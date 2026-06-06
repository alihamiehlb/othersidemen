/**
 * Builds client/public/catalog-preview.json for homepage + shop fallback when API is slow/down.
 * Images must already exist on Pages CDN under /images/catalog/...
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(root, 'scripts/catalog-manifest.json'), 'utf8'))

const mapItem = ({ _id, slug, name, price, images, category, description, sizes, colors }) => ({
  _id: _id ?? slug,
  slug,
  name,
  price,
  images,
  category,
  description,
  sizes,
  colors,
})

const pick = (category, limit) =>
  manifest.items.filter((item) => item.category === category).slice(0, limit).map(mapItem)

const preview = {
  generatedAt: new Date().toISOString(),
  total: manifest.items.length,
  looks: pick('looks', 12),
  styleDna: pick('looks', 5),
  all: manifest.items.map(mapItem),
}

writeFileSync(
  join(root, 'client/public/catalog-preview.json'),
  JSON.stringify(preview, null, 0),
  'utf8',
)

console.log(
  `catalog-preview.json: ${preview.looks.length} looks, ${preview.styleDna.length} style cards, ${preview.all.length} shop items`,
)
