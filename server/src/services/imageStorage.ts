import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { env } from '../config/env.js'
import { isR2Configured, pathToR2Key, putR2Object } from '../lib/r2.js'

const ALLOWED_CATEGORIES = new Set(['looks', 'tops', 'bottoms', 'outerwear', 'footwear', 'accessories', 'uploads'])

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

export async function processAndStoreImage(
  input: Buffer,
  category: string,
  slugHint?: string,
): Promise<{ url: string; key: string }> {
  if (!ALLOWED_CATEGORIES.has(category)) {
    throw new Error('Invalid category')
  }

  const webp = await sharp(input)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()

  const slug = slugHint?.replace(/[^a-z0-9-]/gi, '').toLowerCase()
    || createHash('sha256').update(webp).digest('hex').slice(0, 12)
  const filename = slugHint ? `${slug}.webp` : `${slug}-${Date.now()}.webp`
  const dbPath = `/images/catalog/${category}/${filename}`
  const r2Key = pathToR2Key(dbPath)

  if (isR2Configured()) {
    const publicUrl = await putR2Object(r2Key, webp, 'image/webp')
    return { url: publicUrl, key: r2Key }
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('R2 is required for image uploads in production. Run scripts/setup-r2.ps1')
  }

  const localDir = path.join(repoRoot, 'client', 'public', 'images', 'catalog', category)
  await fs.mkdir(localDir, { recursive: true })
  await fs.writeFile(path.join(localDir, filename), webp)
  return { url: dbPath, key: r2Key }
}
