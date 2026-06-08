import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import hpp from 'hpp'
import passport from 'passport'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'
import { configurePassport } from './config/passport.js'
import { getRedisClient } from './config/redis.js'
import { csrfProtection, generateCsrfToken } from './middleware/csrf.js'
import { errorHandler } from './middleware/errorHandler.js'
import { globalLimiter, healthLimiter, webhookLimiter } from './middleware/rateLimit.js'
import { adminRouter } from './routes/admin/index.js'
import { authRouter } from './routes/auth.js'
import { cartRouter } from './routes/cart.js'
import { healthRouter } from './routes/health.js'
import { ordersRouter } from './routes/orders.js'
import { paymentsRouter, webhookHandler } from './routes/payments.js'
import { productsRouter } from './routes/products.js'
import { whatsappRouter } from './routes/whatsapp.js'
import { sendSuccess } from './utils/apiResponse.js'

const app = express()

app.set('trust proxy', 1)

app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}))

app.use(cors({
  origin: env.NODE_ENV === 'development'
    ? (origin, callback) => {
        if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      }
    : env.CORS_ORIGIN,
  credentials: true,
}))

app.use(globalLimiter)

// Payment webhook MUST receive the raw body for HMAC verification, so it is
// mounted BEFORE express.json / mongoSanitize / hpp — those would parse and
// mutate the bytes and break the signature. Keep this above the JSON parser.
app.post(
  '/api/payments/webhook',
  webhookLimiter,
  express.raw({ type: '*/*', limit: '100kb' }),
  webhookHandler,
)

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())
app.use(mongoSanitize())
app.use(hpp())

configurePassport()
app.use(passport.initialize())

app.use('/api/health', healthLimiter, healthRouter)

app.get('/api/csrf-token', (req, res) => {
  const token = generateCsrfToken(req, res)
  sendSuccess(res, { csrfToken: token })
})

app.use('/api/auth', authRouter)
app.use('/api/whatsapp', whatsappRouter)
app.use('/api/products', productsRouter)
app.use('/api/cart', csrfProtection, cartRouter)
app.use('/api/payments', csrfProtection, paymentsRouter)
app.use('/api/orders', csrfProtection, ordersRouter)
app.use('/api/admin', csrfProtection, adminRouter)

app.get('/api', (_req, res) => {
  sendSuccess(res, { message: 'OTHER SIDE API', version: '1.0.0' })
})

app.use(errorHandler)

function assertPaymentConfig(): void {
  if (env.PAYMENT_MODE !== 'live') return
  const missing = [
    !env.WHISH_WEBHOOK_SECRET && 'WHISH_WEBHOOK_SECRET',
    !env.WHISH_API_KEY && 'WHISH_API_KEY',
    !env.WHISH_MERCHANT_ID && 'WHISH_MERCHANT_ID',
    !env.WHISH_API_URL && 'WHISH_API_URL',
  ].filter(Boolean)
  if (missing.length === 0) return
  // Without these, live payments silently fail (webhooks rejected, checkout dead).
  console.error(`[payments] PAYMENT_MODE=live but missing: ${missing.join(', ')}`)
  if (env.NODE_ENV === 'production') process.exit(1)
  console.warn('[payments] continuing in non-production — set the secrets or use PAYMENT_MODE=mock')
}

async function start() {
  assertPaymentConfig()

  const redis = getRedisClient()
  if (redis) {
    try {
      await redis.connect()
    } catch (err) {
      console.warn('[redis] Could not connect — running without cache:', err)
    }
  }

  try {
    await connectDB()
  } catch (err) {
    console.error('[mongodb] Initial connection failed — data routes retry on each request:', err)
  }

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[server] Listening on 0.0.0.0:${env.PORT}`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] Port ${env.PORT} already in use`)
      process.exit(1)
    }
    console.error('[server] Listen error:', err)
    process.exit(1)
  })
}

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason)
})

start().catch((err) => {
  console.error('[server] Startup failed:', err)
  process.exit(1)
})
