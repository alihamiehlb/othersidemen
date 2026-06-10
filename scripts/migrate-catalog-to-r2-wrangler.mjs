/**
 * Upload catalog WebP files to R2 using wrangler (uses your wrangler login — no S3 keys needed).
 * Usage: node scripts/migrate-catalog-to-r2-wrangler.mjs [--dry-run] [--limit=N]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CATALOG_DIR = path.join(ROOT, 'client', 'public', 'images', 'catalog')
const WRANGLER_CWD = path.join(ROOT, 'cloudflare', 'api')
const BUCKET = 'twoside-store-assets'

const dryRun = process.argv.includes('--dry-run')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity

function collectWebpFiles(dir, base = '') {
  const files = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      files.push(...collectWebpFiles(full, path.join(base, name)))
    } else if (name.endsWith('.webp')) {
      const rel = base ? `${base.replace(/\\/g, '/')}/${name}` : name
      files.push({
        full,
        objectPath: `${BUCKET}/images/catalog/${rel}`,
      })
    }
  }
  return files
}

function uploadOne(objectPath, filePath) {
  if (dryRun) {
    console.log(`[dry-run] ${objectPath}`)
    return true
  }
  const result = spawnSync(
    'npx',
    ['wrangler', 'r2', 'object', 'put', objectPath, '--file', filePath, '--remote', '--content-type', 'image/webp', '-y'],
    { cwd: WRANGLER_CWD, stdio: 'pipe', shell: true },
  )
  if (result.status !== 0) {
    console.error(result.stderr?.toString() ?? result.stdout?.toString())
    return false
  }
  return true
}

function main() {
  if (!fs.existsSync(CATALOG_DIR)) {
    console.error('Missing catalog dir:', CATALOG_DIR)
    process.exit(1)
  }

  const files = collectWebpFiles(CATALOG_DIR).slice(0, limit)
  console.log(`[r2-wrangler] Uploading ${files.length} files to ${BUCKET}`)

  let ok = 0
  let fail = 0
  for (let i = 0; i < files.length; i++) {
    if (i % 25 === 0) console.log(`[r2-wrangler] ${i}/${files.length}`)
    if (uploadOne(files[i].objectPath, files[i].full)) ok++
    else fail++
  }

  console.log(`[r2-wrangler] complete: ${ok} ok, ${fail} failed${dryRun ? ' (dry run)' : ''}`)
  if (fail > 0) process.exit(1)
}

main()
