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
import { globalLimiter, healthLimiter } from './middleware/rateLimit.js'
import { adminRouter } from './routes/admin/index.js'
import { authRouter } from './routes/auth.js'
import { cartRouter } from './routes/cart.js'
import { healthRouter } from './routes/health.js'
import { ordersRouter } from './routes/orders.js'
import { paymentsRouter } from './routes/payments.js'
import { productsRouter } from './routes/products.js'
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
app.use('/api/products', productsRouter)
app.use('/api/cart', csrfProtection, cartRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/orders', csrfProtection, ordersRouter)
app.use('/api/admin', csrfProtection, adminRouter)

app.get('/api', (_req, res) => {
  sendSuccess(res, { message: 'OTHER SIDE API', version: '1.0.0' })
})

app.use(errorHandler)

async function start() {
  await connectDB()

  const redis = getRedisClient()
  if (redis) {
    try {
      await redis.connect()
    } catch (err) {
      console.warn('[redis] Could not connect — running without cache:', err)
    }
  }

  app.listen(env.PORT, () => {
    console.log(`[server] Running on http://localhost:${env.PORT}`)
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] Port ${env.PORT} already in use. Run: npm run dev:clean`)
      process.exit(1)
    }
    throw err
  })
}

start()
