import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:3001/api/auth/google/callback'),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters'),
  ADMIN_EMAIL: z.string().email().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
  WHISH_MERCHANT_ID: z.string().optional(),
  WHISH_API_KEY: z.string().optional(),
  WHISH_API_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('[env] Invalid environment variables:', result.error.flatten().fieldErrors)
    if (process.env.NODE_ENV === 'production') process.exit(1)
  }
  return result.success ? result.data : envSchema.parse({
    ...process.env,
    MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/twoside-store',
    JWT_SECRET: process.env.JWT_SECRET ?? 'dev-only-secret-change-in-production-32chars',
    CSRF_SECRET: process.env.CSRF_SECRET ?? 'dev-only-csrf-secret-change-in-prod-32c',
  })
}

export const env = loadEnv()
