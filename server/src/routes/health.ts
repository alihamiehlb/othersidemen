import { Router } from 'express'
import mongoose from 'mongoose'
import { getRedisClient } from '../config/redis.js'
import { getPaymentConfig } from '../services/payments/index.js'
import { env } from '../config/env.js'
import { sendError, sendSuccess } from '../utils/apiResponse.js'

export const healthRouter = Router()

async function checkMongo(): Promise<'connected' | 'disconnected' | 'error'> {
  const state = mongoose.connection.readyState
  if (state === 1) return 'connected'
  if (state === 0 || state === 3) return 'disconnected'
  return 'error'
}

async function checkRedis(): Promise<'connected' | 'disabled' | 'error'> {
  const redis = getRedisClient()
  if (!redis) return 'disabled'
  try {
    await redis.ping()
    return 'connected'
  } catch {
    return 'error'
  }
}

healthRouter.get('/', async (_req, res) => {
  const [mongodb, redis] = await Promise.all([checkMongo(), checkRedis()])
  const ok = mongodb === 'connected' && (redis === 'connected' || redis === 'disabled')

  const body =
    env.NODE_ENV === 'production'
      ? { status: ok ? 'ok' : 'degraded', timestamp: new Date().toISOString() }
      : {
          status: ok ? 'ok' : 'degraded',
          timestamp: new Date().toISOString(),
          services: {
            mongodb,
            redis,
            googleOAuth: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
            captcha: Boolean(env.TURNSTILE_SECRET_KEY),
            whishPay: getPaymentConfig().whishEnabled,
          },
          environment: env.NODE_ENV,
        }

  if (ok) {
    sendSuccess(res, body)
    return
  }

  res.status(503).json({ success: false, data: body, error: 'Service degraded' })
})

healthRouter.get('/ready', async (_req, res) => {
  const mongodb = await checkMongo()
  if (mongodb !== 'connected') {
    sendError(res, 'Database not ready', 503)
    return
  }
  sendSuccess(res, { ready: true })
})

healthRouter.get('/live', (_req, res) => {
  sendSuccess(res, { alive: true })
})
