import { env } from './env.js'

/** First-party cookies via Pages `/api` proxy (same-origin). */
export function cookieOptions(maxAgeMs?: number): {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'none'
  path: string
  maxAge?: number
} {
  const production = env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    path: '/',
    ...(maxAgeMs !== undefined ? { maxAge: maxAgeMs } : {}),
  }
}
