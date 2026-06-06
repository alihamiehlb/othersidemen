/**
 * Downloads catalog WebP files from a deployment that still has images.
 * Usage: node scripts/sync-catalog-images.mjs
 * Env: CATALOG_CDN_SOURCE (default: preview deployment with full catalog)
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = (process.env.CATALOG_CDN_SOURCE ?? 'https://03fee126.twoside-store.pages.dev').replace(/\/$/, '')
const outDir = join(root, 'client/public/images/catalog')
const manifest = JSON.parse(readFileSync(join(root, 'scripts/catalog-manifest.json'), 'utf8'))

const paths = [...new Set(manifest.items.flatMap((item) => item.images ?? []))]
const concurrency = 20
let ok = 0
let skip = 0
let fail = 0

async function downloadOne(imagePath) {
  const rel = imagePath.replace(/^\//, '')
  const dest = join(root, 'client/public', rel)
  if (existsSync(dest)) {
    skip++
    return
  }
  mkdirSync(dirname(dest), { recursive: true })
  const url = `${source}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`
  try {
    const res = await fetch(url)
    if (!res.ok || !res.headers.get('content-type')?.includes('webp')) {
      fail++
      return
    }
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(dest, buf)
    ok++
  } catch {
    fail++
  }
}

console.log(`Syncing ${paths.length} images from ${source} → client/public/...`)

for (let i = 0; i < paths.length; i += concurrency) {
  await Promise.all(paths.slice(i, i + concurrency).map(downloadOne))
  if ((i + concurrency) % 100 === 0 || i + concurrency >= paths.length) {
    console.log(`  progress: ${Math.min(i + concurrency, paths.length)}/${paths.length}`)
  }
}

console.log(`Done: ${ok} downloaded, ${skip} skipped, ${fail} failed`)
if (fail > 0) process.exitCode = 1
