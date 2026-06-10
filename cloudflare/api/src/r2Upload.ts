import type { Env } from './index.js'
import { getContainer } from '@cloudflare/containers'

const ALLOWED_CATEGORIES = new Set(['looks', 'tops', 'bottoms', 'outerwear', 'footwear', 'accessories', 'uploads'])

async function verifyAdmin(request: Request, env: Env): Promise<boolean> {
  const container = getContainer(env.TWOSIDE_SERVER)
  const meUrl = new URL(request.url)
  meUrl.pathname = '/api/auth/me'
  const res = await container.fetch(
    new Request(meUrl.toString(), {
      method: 'GET',
      headers: request.headers,
    }),
  )
  if (!res.ok) return false
  const json = (await res.json()) as { success?: boolean; data?: { role?: string } }
  return json.success === true && json.data?.role === 'admin'
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function handleAdminUpload(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/api/admin/upload' || request.method !== 'POST') return null
  if (!env.ASSETS || !env.R2_PUBLIC_URL) {
    return Response.json(
      { success: false, data: null, error: 'R2 is not configured on the worker' },
      { status: 503 },
    )
  }

  const isAdmin = await verifyAdmin(request, env)
  if (!isAdmin) {
    return Response.json({ success: false, data: null, error: 'Admin access required' }, { status: 403 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ success: false, data: null, error: 'Invalid upload payload' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ success: false, data: null, error: 'No image file provided' }, { status: 400 })
  }

  const categoryRaw = String(form.get('category') ?? 'uploads')
  if (!ALLOWED_CATEGORIES.has(categoryRaw)) {
    return Response.json({ success: false, data: null, error: 'Invalid category' }, { status: 400 })
  }

  const slugHint = typeof form.get('slug') === 'string' ? String(form.get('slug')) : ''
  const base = slugHint ? slugify(slugHint) : slugify(file.name.replace(/\.[^.]+$/, ''))
  const ext = file.type === 'image/webp' ? 'webp' : 'webp'
  const filename = slugHint ? `${base}.${ext}` : `${base}-${Date.now()}.${ext}`
  const key = `images/catalog/${categoryRaw}/${filename}`

  await env.ASSETS.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'image/webp',
      cacheControl: 'public, max-age=31536000, immutable',
    },
  })

  const publicBase = env.R2_PUBLIC_URL.replace(/\/$/, '')
  return Response.json(
    {
      success: true,
      data: { url: `${publicBase}/${key}`, key },
      error: null,
    },
    { status: 201 },
  )
}
