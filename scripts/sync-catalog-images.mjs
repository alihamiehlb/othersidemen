/**
 * Downloads catalog WebP files for CI/Pages builds (fallback assets when CDN is down).
 * Tries sources in order — R2 first (full catalog), legacy Pages CDN second.
 *
 * Usage: node scripts/sync-catalog-images.mjs
 * Env:
 *   CATALOG_CDN_SOURCES — comma-separated base URLs (default: R2, then legacy Pages)
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'client/public/images/catalog')

const DEFAULT_SOURCES = [
  'https://pub-9e3df3cf3913429bbaba57ed2d8f6e9b.r2.dev',
  'https://03fee126.twoside-store.pages.dev',
]

function parseSources() {
  const raw = process.env.CATALOG_CDN_SOURCES ?? process.env.CATALOG_CDN_SOURCE
  if (!raw) return DEFAULT_SOURCES
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

const sources = parseSources()
const manifest = JSON.parse(readFileSync(join(root, 'scripts/catalog-manifest.json'), 'utf8'))
const paths = [...new Set(manifest.items.flatMap((item) => item.images ?? []))]
const concurrency = 20
let ok = 0
let skip = 0
let fail = 0
const failedPaths = []

function isWebp(buf) {
  return buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP'
}

async function fetchWebpFromSource(base, imagePath) {
  const url = `${base}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`
  const res = await fetch(url)
  if (!res.ok) return null
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('text/html')) return null
  const buf = Buffer.from(await res.arrayBuffer())
  if (!isWebp(buf)) return null
  return buf
}

async function downloadOne(imagePath) {
  const rel = imagePath.replace(/^\//, '')
  const dest = join(root, 'client/public', rel)
  if (existsSync(dest)) {
    skip++
    return
  }
  mkdirSync(dirname(dest), { recursive: true })

  for (const base of sources) {
    try {
      const buf = await fetchWebpFromSource(base, imagePath)
      if (buf) {
        writeFileSync(dest, buf)
        ok++
        return
      }
    } catch {
      // try next source
    }
  }

  fail++
  failedPaths.push(imagePath)
}

console.log(`Syncing ${paths.length} images from [${sources.join(', ')}] → client/public/...`)

for (let i = 0; i < paths.length; i += concurrency) {
  await Promise.all(paths.slice(i, i + concurrency).map(downloadOne))
  if ((i + concurrency) % 100 === 0 || i + concurrency >= paths.length) {
    console.log(`  progress: ${Math.min(i + concurrency, paths.length)}/${paths.length}`)
  }
}

console.log(`Done: ${ok} downloaded, ${skip} skipped, ${fail} failed`)
if (failedPaths.length > 0) {
  console.error('Failed paths:')
  for (const p of failedPaths.slice(0, 20)) console.error(`  ${p}`)
  if (failedPaths.length > 20) console.error(`  ... and ${failedPaths.length - 20} more`)
  process.exitCode = 1
}
