/**
 * Builds client/public/catalog-preview.json for homepage fallback when API is slow/down.
 * Images must already exist on Pages CDN under /images/catalog/...
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(root, 'scripts/catalog-manifest.json'), 'utf8'))

const pick = (category, limit) =>
  manifest.items
    .filter((item) => item.category === category)
    .slice(0, limit)
    .map(({ _id, slug, name, price, images, category: cat, description, sizes, colors }) => ({
      _id: _id ?? slug,
      slug,
      name,
      price,
      images,
      category: cat,
      description,
      sizes,
      colors,
    }))

const preview = {
  generatedAt: new Date().toISOString(),
  looks: pick('looks', 12),
  styleDna: pick('looks', 5),
}

writeFileSync(
  join(root, 'client/public/catalog-preview.json'),
  JSON.stringify(preview, null, 0),
  'utf8',
)

console.log(`catalog-preview.json: ${preview.looks.length} looks, ${preview.styleDna.length} style cards`)
