/**
 * Classify all Instagram archive photos, convert to WebP, build catalog manifest.
 * Usage: node scripts/import-catalog.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { classifyText } from './lib/category-classifier.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const EXTRACT = path.join(ROOT, '.tmp-extract', 'otherside.men')
const OUT_BASE = path.join(ROOT, 'client', 'public', 'images', 'catalog')
const MANIFEST_PATH = path.join(__dirname, 'catalog-manifest.json')

const CATEGORY_PRICE = {
  outerwear: 149,
  tops: 79,
  bottoms: 89,
  footwear: 119,
  accessories: 59,
  looks: 99,
}

const CATEGORY_SIZES = {
  footwear: ['7', '8', '9', '10', '11', '12'],
  accessories: ['One Size'],
  default: ['S', 'M', 'L', 'XL'],
}

function parseCaptionMeta(caption) {
  const likesMatch = caption.match(/Likes:\s*(\d+)/i)
  const urlMatch = caption.match(/URL:\s*(https?:\/\/[^\s]+)/i)
  return {
    likes: likesMatch ? Number(likesMatch[1]) : 0,
    instagramUrl: urlMatch?.[1] ?? null,
  }
}

function nameFromCaption(caption, rel) {
  const line = caption.split('\n').find((l) => l.trim() && !/^Posted:/i.test(l) && !/^Likes:/i.test(l) && !/^URL:/i.test(l))
  if (line) {
    return line
      .replace(/#\S+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 100) || fallbackName(rel)
  }
  return fallbackName(rel)
}

function fallbackName(rel) {
  const match = rel.match(/(\d{4}-\d{2}-\d{2})_None\/(\d+)/)
  if (match) return `Otherside Look ${match[1]} #${match[2]}`
  return `Otherside Item ${rel.replace(/[^\dA-Za-z]+/g, '-').slice(0, 40)}`
}

function slugFromRel(rel) {
  const match = rel.match(/(\d{4}-\d{2}-\d{2})_None\/(\d+)\.jpe?g$/i)
  if (match) return `os-${match[1]}-${match[2]}`
  return `os-${rel.replace(/\.jpe?g$/i, '').replace(/[^\dA-Za-z]+/g, '-').toLowerCase()}`
}

function sourceIdFromRel(rel) {
  return rel.replace(/\\/g, '/')
}

function readCaption(jpgPath) {
  const txt = `${jpgPath}.txt`
  if (!fs.existsSync(txt)) return ''
  try {
    return fs.readFileSync(txt, 'utf8')
  } catch {
    return ''
  }
}

function collectImages() {
  const images = []
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      if (fs.statSync(full).isDirectory()) walk(full)
      else if (/\.jpe?g$/i.test(name)) {
        const rel = path.relative(EXTRACT, full).replace(/\\/g, '/')
        const caption = readCaption(full)
        images.push({ full, rel, caption, ...parseCaptionMeta(caption) })
      }
    }
  }
  walk(EXTRACT)
  return images
}

async function toWebp(inputPath, outputPath) {
  if (fs.existsSync(outputPath)) return
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  await sharp(inputPath)
    .rotate()
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outputPath)
}

async function main() {
  if (!fs.existsSync(EXTRACT)) {
    console.error('Missing .tmp-extract/otherside.men — run npm run process-images first')
    process.exit(1)
  }

  const images = collectImages()
  console.log(`[catalog] Processing ${images.length} photos`)

  const items = []
  const categoryCounts = {}

  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    if (i % 50 === 0) console.log(`[catalog] ${i}/${images.length}`)

    const category = classifyText(img.caption)
    categoryCounts[category] = (categoryCounts[category] ?? 0) + 1
    const slug = slugFromRel(img.rel)
    const sourceId = sourceIdFromRel(img.rel)
    const webpRel = `${category}/${slug}.webp`
    const webpPath = path.join(OUT_BASE, webpRel)
    const publicPath = `/images/catalog/${webpRel}`

    await toWebp(img.full, webpPath)

    const name = nameFromCaption(img.caption, img.rel)
    items.push({
      sourceId,
      slug,
      name,
      description: img.caption.split('\n').slice(0, 3).join(' ').trim() || name,
      category,
      price: CATEGORY_PRICE[category] ?? 99,
      images: [publicPath],
      sizes: CATEGORY_SIZES[category] ?? CATEGORY_SIZES.default,
      colors: ['Black', 'Charcoal', 'Navy', 'White', 'Olive'],
      stock: 25,
      isActive: true,
      isFeatured: false,
      tags: ['catalog', category],
      instagramUrl: img.instagramUrl,
      likes: img.likes,
      source: img.rel,
    })
  }

  items.sort((a, b) => b.likes - a.likes)
  for (let i = 0; i < Math.min(6, items.length); i++) {
    items[i].isFeatured = true
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    total: items.length,
    categoryCounts,
    items,
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
  console.log('[catalog] Category breakdown:', categoryCounts)
  console.log(`[catalog] Manifest: ${MANIFEST_PATH}`)
  console.log('[catalog] Next: npm run import-catalog -w server')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
