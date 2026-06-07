import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { getRedisClient } from '../config/redis.js'

/**
 * Build a Redis-backed store so limits are shared across all Container instances.
 * Falls back to in-memory when Redis is unavailable (dev without Docker).
 * Called lazily (inside rateLimit config) so Redis client is already initialised.
 */
function makeStore(prefix: string): RedisStore | undefined {
  const client = getRedisClient()
  if (!client) return undefined
  return new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      client.call(command, ...args) as Promise<number>,
    prefix: `rl:${prefix}:`,
  })
}

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('global'),
  message: { success: false, data: null, error: 'Too many requests. Please try again later.' },
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('auth'),
  message: { success: false, data: null, error: 'Too many auth attempts. Please try again later.' },
})

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('admin'),
})

export const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('health'),
})

// Payment webhooks arrive from the provider and may legitimately retry; keep the
// limit generous but bounded to blunt a spoofed-webhook flood (signature still
// rejects forgeries — this just caps the work spent verifying them).
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('webhook'),
  message: { success: false, data: null, error: 'Too many requests.' },
})
