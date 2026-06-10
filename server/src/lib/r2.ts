import { env } from '../config/env.js'

export const R2_BUCKET = env.R2_BUCKET_NAME ?? env.R2_BUCKET ?? 'twoside-store-assets'

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID
    && env.R2_ACCESS_KEY_ID
    && env.R2_SECRET_ACCESS_KEY
    && R2_BUCKET
    && env.R2_PUBLIC_URL,
  )
}

export function r2PublicUrl(key: string): string {
  if (!env.R2_PUBLIC_URL) throw new Error('R2_PUBLIC_URL is not configured')
  const base = env.R2_PUBLIC_URL.replace(/\/$/, '')
  const normalized = key.startsWith('/') ? key.slice(1) : key
  return `${base}/${normalized}`
}

/** Map DB path `/images/catalog/...` → R2 object key `images/catalog/...` */
export function pathToR2Key(imagePath: string): string {
  return imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
}

/** Map R2 object key → public URL */
export function imagePathToPublicUrl(imagePath: string): string {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath
  if (isR2Configured()) return r2PublicUrl(pathToR2Key(imagePath))
  return imagePath
}

export async function getR2Client() {
  if (!isR2Configured()) throw new Error('R2 is not configured')
  const { S3Client } = await import('@aws-sdk/client-s3')
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export async function putR2Object(key: string, body: Buffer, contentType: string): Promise<string> {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3')
  const client = await getR2Client()
  const normalizedKey = key.startsWith('/') ? key.slice(1) : key
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: normalizedKey,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
  return r2PublicUrl(normalizedKey)
}
