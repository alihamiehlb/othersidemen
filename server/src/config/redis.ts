import { Redis } from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis | null {
  if (redis) return redis

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.warn('[redis] REDIS_URL not set — caching disabled')
    return null
  }

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableReadyCheck: true,
    // Upstash requires TLS — use rediss:// in REDIS_URL
    ...(redisUrl.startsWith('rediss://') ? { tls: {} } : {}),
  })

  redis.on('error', (err: Error) => {
    console.error('[redis] Connection error:', err.message)
  })

  redis.on('connect', () => {
    console.log('[redis] Connected')
  })

  return redis
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient()
  if (!client) return null

  try {
    const data = await client.get(key)
    return data ? (JSON.parse(data) as T) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch (err) {
    console.error('[redis] Cache set failed:', err)
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    await client.del(key)
  } catch (err) {
    console.error('[redis] Cache delete failed:', err)
  }
}
