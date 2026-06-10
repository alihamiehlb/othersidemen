/**
 * Reclassify catalog images one-by-one using improved keyword rules.
 * Moves WebP files between category folders and updates catalog-manifest.json.
 *
 * Usage: node scripts/reclassify-catalog.mjs [--dry-run]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { classifyText } from './lib/category-classifier.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MANIFEST_PATH = path.join(__dirname, 'catalog-manifest.json')
const CATALOG_BASE = path.join(ROOT, 'client', 'public', 'images', 'catalog')
const EXTRACT = path.join(ROOT, '.tmp-extract', 'otherside.men')

const dryRun = process.argv.includes('--dry-run')

function readCaptionForSource(sourceId) {
  if (!sourceId || !fs.existsSync(EXTRACT)) return ''
  const jpg = path.join(EXTRACT, sourceId.replace(/\//g, path.sep))
  const txt = `${jpg}.txt`
  if (!fs.existsSync(txt)) return ''
  try {
    return fs.readFileSync(txt, 'utf8')
  } catch {
    return ''
  }
}

function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('Missing catalog-manifest.json — run npm run import-catalog first')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
  const categoryCounts = {}
  let moved = 0
  let reclassified = 0

  for (const item of manifest.items) {
    const caption = readCaptionForSource(item.sourceId)
    const text = [item.name, item.description, caption].filter(Boolean).join(' ')
    const newCategory = classifyText(text)
    const oldCategory = item.category

    categoryCounts[newCategory] = (categoryCounts[newCategory] ?? 0) + 1

    if (newCategory === oldCategory) continue
    reclassified++

    const oldPath = path.join(CATALOG_BASE, oldCategory, `${item.slug}.webp`)
    const newPath = path.join(CATALOG_BASE, newCategory, `${item.slug}.webp`)
    const newPublic = `/images/catalog/${newCategory}/${item.slug}.webp`

    console.log(`[reclassify] ${item.slug}: ${oldCategory} → ${newCategory}`)

    if (!dryRun) {
      if (fs.existsSync(oldPath)) {
        fs.mkdirSync(path.dirname(newPath), { recursive: true })
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
        fs.renameSync(oldPath, newPath)
        moved++
      } else if (fs.existsSync(newPath)) {
        // already in target folder
      } else {
        console.warn(`  ⚠ missing file: ${oldPath}`)
      }
      item.category = newCategory
      item.images = [newPublic]
      if (!item.tags?.includes(newCategory)) {
        item.tags = [...(item.tags ?? []).filter((t) => t !== oldCategory), newCategory]
      }
    }
  }

  if (!dryRun) {
    manifest.categoryCounts = categoryCounts
    manifest.generatedAt = new Date().toISOString()
    manifest.reclassifiedAt = new Date().toISOString()
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
  }

  console.log(`[reclassify] ${reclassified} items reclassified, ${moved} files moved${dryRun ? ' (dry run)' : ''}`)
  console.log('[reclassify] Category breakdown:', categoryCounts)
  if (!dryRun) console.log('[reclassify] Next: npm run import-catalog:db && npm run build:client')
}

main()
