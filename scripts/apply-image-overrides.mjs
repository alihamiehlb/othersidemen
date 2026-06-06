/**
 * Apply curated product + outfit-builder image mappings.
 * Usage: node scripts/apply-image-overrides.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const EXTRACT = path.join(ROOT, '.tmp-extract', 'otherside.men')
const OVERRIDES = JSON.parse(fs.readFileSync(path.join(__dirname, 'image-overrides.json'), 'utf8'))
const MANIFEST_PATH = path.join(__dirname, 'image-manifest.json')

async function toWebp(relPath, outPath, width, quality = 82) {
  const src = path.join(EXTRACT, relPath.replace(/\//g, path.sep))
  if (!fs.existsSync(src)) {
    throw new Error(`Missing source: ${relPath}`)
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  await sharp(src).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(outPath)
}

async function main() {
  if (!fs.existsSync(EXTRACT)) {
    console.error('Run npm run process-images first (needs .tmp-extract/otherside.men)')
    process.exit(1)
  }

  const manifest = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : { products: {}, lookbook: {}, styleDna: {}, hero: { path: '/images/hero.webp' } }

  manifest.products ??= {}
  manifest.outfitBuilder ??= {}

  for (const [slug, rel] of Object.entries(OVERRIDES.products)) {
    const out = path.join(ROOT, 'client', 'public', 'images', 'products', `${slug}.webp`)
    await toWebp(rel, out, 800)
    manifest.products[slug] = {
      path: `/images/products/${slug}.webp`,
      source: rel,
      manual: true,
    }
    console.log(`[products] ${slug} ← ${rel}`)
  }

  for (const [id, rel] of Object.entries(OVERRIDES.outfitBuilder)) {
    const out = path.join(ROOT, 'client', 'public', 'images', 'outfit-builder', `${id}.webp`)
    await toWebp(rel, out, 480)
    manifest.outfitBuilder[id] = {
      path: `/images/outfit-builder/${id}.webp`,
      source: rel,
    }
    console.log(`[outfit] ${id} ← ${rel}`)
  }

  if (OVERRIDES.outfitPreview) {
    const out = path.join(ROOT, 'client', 'public', 'images', 'outfit-builder', 'preview.webp')
    await toWebp(OVERRIDES.outfitPreview, out, 900, 85)
    manifest.outfitBuilder.preview = {
      path: '/images/outfit-builder/preview.webp',
      source: OVERRIDES.outfitPreview,
    }
  }

  manifest.generatedAt = new Date().toISOString()
  manifest.totalSourceImages = manifest.totalSourceImages ?? 791
  manifest.note =
    '791 photos in zip; 18 curated for storefront UI (6 products + 5 lookbook + 5 style DNA + hero + outfit builder). Run process-images to regenerate lookbook/style from captions.'

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
  console.log('[done] Overrides applied — run: node scripts/sync-images-config.mjs && npm run update-images')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
