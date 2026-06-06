import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectDB } from '../config/db.js'
import { Product } from '../models/Product.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MANIFEST_PATH = path.resolve(__dirname, '../../../scripts/catalog-manifest.json')

interface CatalogItem {
  sourceId: string
  slug: string
  name: string
  description: string
  category: string
  price: number
  images: string[]
  sizes: string[]
  colors: string[]
  stock: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  instagramUrl?: string | null
}

async function importCatalog() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('[import-catalog] Run: node scripts/import-catalog.mjs first')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as {
    items: CatalogItem[]
    total: number
    categoryCounts: Record<string, number>
  }

  await connectDB()

  const sourceIds = new Set(manifest.items.map((item) => item.sourceId))
  const removed = await Product.deleteMany({ sourceId: { $exists: true, $nin: [...sourceIds] } })
  const removedLegacy = await Product.deleteMany({ sourceId: { $exists: false } })
  console.log(`[import-catalog] Removed ${removed.deletedCount + removedLegacy.deletedCount} old products`)

  const BATCH = 100
  let upserted = 0

  for (let i = 0; i < manifest.items.length; i += BATCH) {
    const batch = manifest.items.slice(i, i + BATCH)
    const ops = batch.map((item) => ({
      updateOne: {
        filter: { sourceId: item.sourceId },
        update: {
          $set: {
            name: item.name,
            slug: item.slug,
            description: item.description,
            price: item.price,
            category: item.category,
            gender: 'men' as const,
            images: item.images,
            sizes: item.sizes,
            colors: item.colors,
            stock: item.stock,
            isActive: item.isActive,
            isFeatured: item.isFeatured,
            tags: item.tags,
            instagramUrl: item.instagramUrl ?? undefined,
            sourceId: item.sourceId,
          },
        },
        upsert: true,
      },
    }))

    const result = await Product.bulkWrite(ops, { ordered: false })
    upserted += result.upsertedCount + result.modifiedCount + result.matchedCount
    console.log(`[import-catalog] Batch ${Math.floor(i / BATCH) + 1} — ${i + batch.length}/${manifest.items.length}`)
  }

  const total = await Product.countDocuments({ isActive: true })
  console.log(`[import-catalog] Done — ${total} active products in database`)
  console.log('[import-catalog] Categories:', manifest.categoryCounts)
  process.exit(0)
}

importCatalog().catch((err) => {
  console.error(err)
  process.exit(1)
})
