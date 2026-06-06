import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectDB } from '../config/db.js'
import { Product } from '../models/Product.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MANIFEST_PATH = path.resolve(__dirname, '../../../scripts/image-manifest.json')

async function updateImages() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('[update-images] Run: node scripts/process-images.mjs first')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as {
    products: Record<string, { path: string; source?: string; caption?: string }>
  }

  await connectDB()

  let updated = 0
  for (const [slug, meta] of Object.entries(manifest.products)) {
    const result = await Product.findOneAndUpdate(
      { slug },
      { $set: { images: [meta.path] } },
      { returnDocument: 'after' },
    )
    if (result) {
      updated++
      console.log(`[update-images] ${slug} → ${meta.path}`)
    } else {
      console.warn(`[update-images] No product found for slug: ${slug}`)
    }
  }

  console.log(`[update-images] Updated ${updated} products`)
  process.exit(0)
}

updateImages().catch((err) => {
  console.error(err)
  process.exit(1)
})
