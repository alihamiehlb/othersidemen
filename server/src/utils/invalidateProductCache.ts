import { getRedisClient } from '../config/redis.js'

export async function invalidateProductCache(slug?: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    const keys = await client.keys('products:*')
    if (keys.length > 0) await client.del(...keys)
    if (slug) await client.del(`product:${slug}`)
    else {
      const slugKeys = await client.keys('product:*')
      if (slugKeys.length > 0) await client.del(...slugKeys)
    }
  } catch (err) {
    console.error('[cache] Product cache invalidation failed:', err)
  }
}
