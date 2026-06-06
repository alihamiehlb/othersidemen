/**
 * Extract Instagram archive images, skip videos, convert to WebP,
 * classify by caption keywords, and write to client/public/images.
 *
 * Usage: node scripts/process-images.mjs
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ZIP = path.join(ROOT, 'otherside.men.zip')
const EXTRACT_DIR = path.join(ROOT, '.tmp-extract', 'otherside.men')
const OUT_DIR = path.join(ROOT, 'client', 'public', 'images')
const MANIFEST_PATH = path.join(ROOT, 'scripts', 'image-manifest.json')

const PRODUCT_RULES = [
  { slug: 'utility-puffer-jacket', keywords: ['puffer', 'quilted', 'padded', 'down jacket', 'insulated'] },
  { slug: 'oversized-hoodie', keywords: ['hoodie', 'hooded', 'sweatshirt', 'crewneck', 'knit'] },
  { slug: 'cargo-pants', keywords: ['cargo', 'trouser', 'pants', 'chino', 'jean', 'denim', 'short'] },
  { slug: 'high-top-sneakers', keywords: ['sneaker', 'trainer', 'shoe', 'loafer', 'boot', 'footwear', 'slide'] },
  { slug: 'bomber-jacket', keywords: ['bomber', 'jacket', 'coat', 'blazer', 'outerwear', 'overshirt', 'shirt', 'tee', 't-shirt', 'polo'] },
  { slug: 'crossbody-bag', keywords: ['bag', 'crossbody', 'tote', 'backpack', 'belt', 'cap', 'accessory'] },
]

const LOOKBOOK_RULES = [
  { key: 'winterLayers', file: 'winter-layers.webp', keywords: ['winter', 'layer', 'puffer', 'coat', 'cold'] },
  { key: 'cityEssentials', file: 'city-essentials.webp', keywords: ['city', 'urban', 'street', 'commute'] },
  { key: 'offDutyLooks', file: 'off-duty.webp', keywords: ['casual', 'relaxed', 'off duty', 'weekend'] },
  { key: 'eveningRefined', file: 'evening-refined.webp', keywords: ['evening', 'formal', 'refined', 'tailored', 'event'] },
  { key: 'weekendEscape', file: 'weekend-escape.webp', keywords: ['weekend', 'escape', 'travel', 'holiday', 'vacation'] },
]

const STYLE_DNA_RULES = [
  { key: 'minimal', file: 'minimal.webp', keywords: ['minimal', 'clean', 'simple', 'essential', 'timeless'] },
  { key: 'street', file: 'street.webp', keywords: ['street', 'urban', 'bold'] },
  { key: 'creative', file: 'creative.webp', keywords: ['creative', 'unique', 'print', 'starfish', 'pattern'] },
  { key: 'classic', file: 'classic.webp', keywords: ['classic', 'refined', 'sharp', 'shirt', 'blazer'] },
  { key: 'tech', file: 'tech.webp', keywords: ['tech', 'utility', 'functional', 'cargo', 'technical'] },
]

function scoreKeywords(text, keywords) {
  const lower = text.toLowerCase()
  let score = 0
  for (const kw of keywords) {
    if (lower.includes(kw)) score += kw.length > 5 ? 3 : 2
  }
  return score
}

function readCaption(jpgPath) {
  const txtPath = `${jpgPath}.txt`
  if (!fs.existsSync(txtPath)) return ''
  try {
    return fs.readFileSync(txtPath, 'utf8')
  } catch {
    return ''
  }
}

function parseLikes(caption) {
  const match = caption.match(/Likes:\s*(\d+)/i)
  return match ? Number(match[1]) : 0
}

function countExtractedJpegs() {
  if (!fs.existsSync(EXTRACT_DIR)) return 0
  let count = 0
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      if (fs.statSync(full).isDirectory()) walk(full)
      else if (/\.jpe?g$/i.test(name)) count++
    }
  }
  walk(EXTRACT_DIR)
  return count
}

function ensureExtracted() {
  const existing = countExtractedJpegs()
  if (existing >= 700) {
    console.log(`[extract] Using existing extraction (${existing} JPEGs)`)
    return
  }
  if (existing > 0) {
    console.log(`[extract] Partial extraction (${existing} JPEGs) — re-extracting all`)
    fs.rmSync(path.dirname(EXTRACT_DIR), { recursive: true, force: true })
  }
  console.log('[extract] Extracting archive (videos ignored during scan)...')
  fs.mkdirSync(path.dirname(EXTRACT_DIR), { recursive: true })
  execSync(`tar -xf "${ZIP}" -C "${path.dirname(EXTRACT_DIR)}"`, { stdio: 'inherit' })
  const extracted = countExtractedJpegs()
  console.log(`[extract] Done — ${extracted} JPEG files on disk`)
}

function collectImages() {
  const images = []
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) walk(full)
      else if (/\.jpe?g$/i.test(name)) {
        const caption = readCaption(full)
        const rel = path.relative(EXTRACT_DIR, full).replace(/\\/g, '/')
        images.push({ full, rel, caption, likes: parseLikes(caption), size: stat.size })
      }
    }
  }
  walk(EXTRACT_DIR)
  return images
}

function pickBest(candidates, usedPaths) {
  return candidates
    .filter((c) => !usedPaths.has(c.full))
    .sort((a, b) => b.score - a.score || b.likes - a.likes || b.size - a.size)[0] ?? null
}

async function toWebp(inputPath, outputPath, width, quality = 82) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  await sharp(inputPath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outputPath)
}

async function main() {
  if (!fs.existsSync(ZIP)) {
    console.error('Missing otherside.men.zip at project root')
    process.exit(1)
  }

  ensureExtracted()
  const images = collectImages()
  console.log(`[scan] ${images.length} images with metadata`)

  const scored = images.map((img) => {
    const captionLine = img.caption.split('\n')[0] ?? ''
    const productScores = PRODUCT_RULES.map((rule) => ({
      slug: rule.slug,
      score: scoreKeywords(img.caption, rule.keywords),
    }))
    const lookbookScores = LOOKBOOK_RULES.map((rule) => ({
      key: rule.key,
      score: scoreKeywords(img.caption, rule.keywords),
    }))
    const styleScores = STYLE_DNA_RULES.map((rule) => ({
      key: rule.key,
      score: scoreKeywords(img.caption, rule.keywords),
    }))
    const bestProduct = productScores.sort((a, b) => b.score - a.score)[0]
    const bestLookbook = lookbookScores.sort((a, b) => b.score - a.score)[0]
    const bestStyle = styleScores.sort((a, b) => b.score - a.score)[0]
    return {
      ...img,
      captionLine,
      productScores,
      lookbookScores,
      styleScores,
      bestProduct,
      bestLookbook,
      bestStyle,
      heroScore: img.likes * 2 + (img.size > 400_000 ? 5 : 0) + (captionLine ? 2 : 0),
    }
  })

  const used = new Set()
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalSourceImages: images.length,
    products: {},
    lookbook: {},
    styleDna: {},
    hero: null,
    assignments: [],
  }

  // Products — one primary image per slug
  for (const rule of PRODUCT_RULES) {
    const candidates = scored
      .map((img) => ({
        ...img,
        score: img.productScores.find((p) => p.slug === rule.slug)?.score ?? 0,
      }))
      .filter((c) => c.score > 0)
    const pick = pickBest(candidates, used)
    if (pick) {
      used.add(pick.full)
      const out = path.join(OUT_DIR, 'products', `${rule.slug}.webp`)
      await toWebp(pick.full, out, 800)
      manifest.products[rule.slug] = {
        path: `/images/products/${rule.slug}.webp`,
        source: pick.rel,
        caption: pick.captionLine,
        score: pick.score,
      }
      manifest.assignments.push({ type: 'product', target: rule.slug, source: pick.rel, caption: pick.captionLine })
    }
  }

  // Fallback: assign unmatched products from remaining high-quality images
  for (const rule of PRODUCT_RULES) {
    if (manifest.products[rule.slug]) continue
    const pick = pickBest(
      scored.filter((img) => !used.has(img.full)).map((img) => ({ ...img, score: img.size / 1000 })),
      used,
    )
    if (pick) {
      used.add(pick.full)
      const out = path.join(OUT_DIR, 'products', `${rule.slug}.webp`)
      await toWebp(pick.full, out, 800)
      manifest.products[rule.slug] = {
        path: `/images/products/${rule.slug}.webp`,
        source: pick.rel,
        caption: pick.captionLine,
        score: 0,
        fallback: true,
      }
    }
  }

  // Lookbook
  for (const rule of LOOKBOOK_RULES) {
    const candidates = scored
      .map((img) => ({
        ...img,
        score: img.lookbookScores.find((l) => l.key === rule.key)?.score ?? 0,
      }))
      .filter((c) => c.score > 0)
    const pick = pickBest(candidates, used) ?? pickBest(scored.map((i) => ({ ...i, score: i.likes })), used)
    if (pick) {
      used.add(pick.full)
      const out = path.join(OUT_DIR, 'lookbook', rule.file)
      await toWebp(pick.full, out, 720)
      manifest.lookbook[rule.key] = {
        path: `/images/lookbook/${rule.file}`,
        source: pick.rel,
        caption: pick.captionLine,
      }
    }
  }

  // Style DNA
  for (const rule of STYLE_DNA_RULES) {
    const candidates = scored
      .map((img) => ({
        ...img,
        score: img.styleScores.find((s) => s.key === rule.key)?.score ?? 0,
      }))
      .filter((c) => c.score > 0)
    const pick = pickBest(candidates, used) ?? pickBest(scored.map((i) => ({ ...i, score: i.likes })), used)
    if (pick) {
      used.add(pick.full)
      const out = path.join(OUT_DIR, 'style-dna', rule.file)
      await toWebp(pick.full, out, 600)
      manifest.styleDna[rule.key] = {
        path: `/images/style-dna/${rule.file}`,
        source: pick.rel,
        caption: pick.captionLine,
      }
    }
  }

  // Hero — prefer root hero files, else best editorial shot
  const heroRootJpeg = path.join(ROOT, 'hero.jpeg')
  const heroRootPng = path.join(ROOT, 'hero.png')
  const heroDesktop = path.join(OUT_DIR, 'hero.webp')
  const heroMobile = path.join(OUT_DIR, 'hero-mobile.webp')

  if (fs.existsSync(heroRootJpeg)) {
    await toWebp(heroRootJpeg, heroDesktop, 1920, 85)
    await toWebp(heroRootJpeg, heroMobile, 900, 80)
    manifest.hero = { path: '/images/hero.webp', source: 'hero.jpeg (project root)' }
  } else if (fs.existsSync(heroRootPng)) {
    await toWebp(heroRootPng, heroDesktop, 1920, 85)
    await toWebp(heroRootPng, heroMobile, 900, 80)
    manifest.hero = { path: '/images/hero.webp', source: 'hero.png (project root)' }
  } else {
    const heroPick = scored.sort((a, b) => b.heroScore - a.heroScore)[0]
    if (heroPick) {
      await toWebp(heroPick.full, heroDesktop, 1920, 85)
      await toWebp(heroPick.full, heroMobile, 900, 80)
      manifest.hero = {
        path: '/images/hero.webp',
        source: heroPick.rel,
        caption: heroPick.captionLine,
      }
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
  console.log(`[done] Manifest written to ${MANIFEST_PATH}`)
  console.log(`[done] Images in ${OUT_DIR}`)
  console.log(`[done] Products: ${Object.keys(manifest.products).length}`)
  console.log(`[done] Lookbook: ${Object.keys(manifest.lookbook).length}`)
  console.log(`[done] Style DNA: ${Object.keys(manifest.styleDna).length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
