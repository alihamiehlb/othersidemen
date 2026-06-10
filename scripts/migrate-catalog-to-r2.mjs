/**
 * Upload all local catalog WebP files to Cloudflare R2 (main image store).
 * Requires R2_* vars in server/.env (see scripts/setup-r2.ps1).
 *
 * Usage: node scripts/migrate-catalog-to-r2.mjs [--dry-run]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CATALOG_DIR = path.join(ROOT, 'client', 'public', 'images', 'catalog')
const dryRun = process.argv.includes('--dry-run')

config({ path: path.join(ROOT, 'server', '.env') })

const accountId = process.env.R2_ACCOUNT_ID
const accessKey = process.env.R2_ACCESS_KEY_ID
const secretKey = process.env.R2_SECRET_ACCESS_KEY
const bucket = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || 'twoside-store-assets'
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '')

if (!accountId || !accessKey || !secretKey || !publicUrl) {
  console.error('Missing R2 credentials in server/.env — run scripts/setup-r2.ps1 first')
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
})

function collectWebpFiles(dir, base = '') {
  const files = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      files.push(...collectWebpFiles(full, path.join(base, name)))
    } else if (name.endsWith('.webp')) {
      files.push({ full, key: path.join('images', 'catalog', base, name).replace(/\\/g, '/') })
    }
  }
  return files
}

async function exists(key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

async function main() {
  if (!fs.existsSync(CATALOG_DIR)) {
    console.error('No catalog directory:', CATALOG_DIR)
    process.exit(1)
  }

  const files = collectWebpFiles(CATALOG_DIR)
  console.log(`[r2-migrate] ${files.length} WebP files → bucket ${bucket}`)

  let uploaded = 0
  let skipped = 0

  for (let i = 0; i < files.length; i++) {
    const { full, key } = files[i]
    if (i % 50 === 0) console.log(`[r2-migrate] ${i}/${files.length}`)

    if (!dryRun && (await exists(key))) {
      skipped++
      continue
    }

    if (dryRun) {
      console.log(`  would upload: ${key}`)
      uploaded++
      continue
    }

    const body = fs.readFileSync(full)
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    uploaded++
  }

  console.log(`[r2-migrate] done: ${uploaded} uploaded, ${skipped} skipped (already in R2)${dryRun ? ' [dry run]' : ''}`)
  console.log(`[r2-migrate] Public base: ${publicUrl}`)
  console.log(`[r2-migrate] Set VITE_CDN_URL=${publicUrl} and redeploy Pages + sync Worker secrets`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
