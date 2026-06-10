import { test, expect } from '@playwright/test'

test.describe('OTHER SIDE live smoke', () => {
  test('home page loads with hero', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/OTHER SIDE/i)
    await expect(page.getByRole('link', { name: /shop/i }).first()).toBeVisible()
  })

  test('API health is ok', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.status).toBe('ok')
    expect(json.data.services.mongodb).toBe('connected')
  })

  test('shop lists products', async ({ page }) => {
    await page.goto('/shop')
    await expect(page.getByRole('heading', { name: /shop all/i })).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-product-card], article, a[href^="/product/"]').first()).toBeVisible({
      timeout: 30_000,
    })
  })

  test('product page loads from API', async ({ page, request }) => {
    const list = await request.get('/api/products?limit=1')
    const json = await list.json()
    expect(json.success).toBe(true)
    const slug = json.data?.[0]?.slug
    expect(slug).toBeTruthy()

    await page.goto(`/product/${slug}`)
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/\$/).first()).toBeVisible()
  })

  test('catalog image resolves', async ({ request }) => {
    const list = await request.get('/api/products?limit=1')
    const json = await list.json()
    const imagePath = json.data?.[0]?.images?.[0] as string | undefined
    expect(imagePath).toBeTruthy()

    const cdn = process.env.PLAYWRIGHT_CDN_URL?.replace(/\/$/, '')
    const imageUrl = cdn && imagePath?.startsWith('/')
      ? `${cdn}${imagePath}`
      : imagePath!.startsWith('http')
        ? imagePath!
        : `${process.env.PLAYWRIGHT_BASE_URL ?? 'https://twoside-store.pages.dev'}${imagePath}`

    const img = await request.get(imageUrl)
    expect(img.status(), `image ${imageUrl}`).toBe(200)
    expect(img.headers()['content-type'] ?? '').toMatch(/image/)
  })

  test('legal pages load', async ({ page }) => {
    for (const path of ['/faq', '/privacy', '/about']) {
      await page.goto(path)
      await expect(page.getByRole('heading').first()).toBeVisible()
    }
  })

  test('admin requires auth', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/(login|admin)/)
  })
})
