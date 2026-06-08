import { Container, getContainer } from '@cloudflare/containers'

export interface Env {
  TWOSIDE_SERVER: DurableObjectNamespace<TwosideServer>
  API_RATE_LIMITER?: { limit: (opts: { key: string }) => Promise<{ success: boolean }> }
  AUTH_RATE_LIMITER?: { limit: (opts: { key: string }) => Promise<{ success: boolean }> }
  MONGODB_URI: string
  REDIS_URL?: string
  JWT_SECRET: string
  JWT_EXPIRES_IN?: string
  CSRF_SECRET: string
  CORS_ORIGIN: string
  CLIENT_URL: string
  ADMIN_EMAIL?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GOOGLE_CALLBACK_URL?: string
  TURNSTILE_SECRET_KEY?: string
  RECAPTCHA_SECRET_KEY?: string // deprecated
  WHISH_MERCHANT_ID?: string
  WHISH_API_KEY?: string
  WHISH_API_URL?: string
  WHATSAPP_NUMBER?: string
}

/** Runs the Express API Docker image on Cloudflare Containers */
export class TwosideServer extends Container<Env> {
  defaultPort = 3001
  sleepAfter = '30m'
  enableInternet = true

  private runtimeEnv(): Record<string, string> {
    const e = this.env
    const vars: Record<string, string> = {
      NODE_ENV: 'production',
      PORT: '3001',
      MONGODB_URI: e.MONGODB_URI,
      JWT_SECRET: e.JWT_SECRET,
      CSRF_SECRET: e.CSRF_SECRET,
      CORS_ORIGIN: e.CORS_ORIGIN,
      CLIENT_URL: e.CLIENT_URL,
    }
    if (e.REDIS_URL) vars.REDIS_URL = e.REDIS_URL
    if (e.JWT_EXPIRES_IN) vars.JWT_EXPIRES_IN = e.JWT_EXPIRES_IN
    if (e.ADMIN_EMAIL) vars.ADMIN_EMAIL = e.ADMIN_EMAIL
    if (e.GOOGLE_CLIENT_ID) vars.GOOGLE_CLIENT_ID = e.GOOGLE_CLIENT_ID
    if (e.GOOGLE_CLIENT_SECRET) vars.GOOGLE_CLIENT_SECRET = e.GOOGLE_CLIENT_SECRET
    if (e.GOOGLE_CALLBACK_URL) vars.GOOGLE_CALLBACK_URL = e.GOOGLE_CALLBACK_URL
    if (e.TURNSTILE_SECRET_KEY) vars.TURNSTILE_SECRET_KEY = e.TURNSTILE_SECRET_KEY
    if (e.RECAPTCHA_SECRET_KEY) vars.RECAPTCHA_SECRET_KEY = e.RECAPTCHA_SECRET_KEY
    if (e.WHISH_MERCHANT_ID) vars.WHISH_MERCHANT_ID = e.WHISH_MERCHANT_ID
    if (e.WHISH_API_KEY) vars.WHISH_API_KEY = e.WHISH_API_KEY
    if (e.WHISH_API_URL) vars.WHISH_API_URL = e.WHISH_API_URL
    if (e.WHATSAPP_NUMBER) vars.WHATSAPP_NUMBER = e.WHATSAPP_NUMBER
    return vars
  }

  override async fetch(request: Request): Promise<Response> {
    await this.startAndWaitForPorts({
      ports: [3001],
      startOptions: {
        envVars: this.runtimeEnv(),
        enableInternet: true,
      },
    })
    return this.containerFetch(request)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const limiter = url.pathname.startsWith('/api/auth') ? env.AUTH_RATE_LIMITER : env.API_RATE_LIMITER

    if (limiter) {
      const { success } = await limiter.limit({ key: clientIp })
      if (!success) {
        return Response.json(
          { success: false, data: null, error: 'Too many requests. Please slow down.' },
          {
            status: 429,
            headers: { 'Access-Control-Allow-Origin': env.CORS_ORIGIN ?? 'null' },
          },
        )
      }
    }

    try {
      const container = getContainer(env.TWOSIDE_SERVER)
      return await container.fetch(request)
    } catch (err) {
      // Log internally but never expose raw error details to the client
      console.error('[worker] Container fetch failed:', err instanceof Error ? err.message : err)

      // Only allow the configured origin — never fall back to wildcard
      const allowedOrigin = env.CORS_ORIGIN || 'null'

      return Response.json(
        { success: false, data: null, error: 'Service temporarily unavailable. Please try again.' },
        {
          status: 503,
          headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Credentials': 'true',
          },
        },
      )
    }
  },
}
