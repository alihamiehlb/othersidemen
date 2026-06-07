import { createHmac, timingSafeEqual } from 'crypto'

/** HMAC-SHA256 of payload, hex-encoded. */
export function hmacSha256Hex(secret: string, payload: Buffer | string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Timing-safe verify of an incoming hex signature against HMAC-SHA256(rawBody).
 * Accepts an optional `sha256=` prefix. Returns false on any malformed input —
 * never throws.
 */
export function verifyHmacSha256(secret: string, rawBody: Buffer, signature: string): boolean {
  if (!secret || !signature) return false

  const sigClean = signature.startsWith('sha256=') ? signature.slice(7) : signature
  if (!/^[0-9a-f]+$/i.test(sigClean) || sigClean.length % 2 !== 0) return false

  const expected = Buffer.from(hmacSha256Hex(secret, rawBody), 'hex')
  const provided = Buffer.from(sigClean, 'hex')
  if (provided.length !== expected.length) return false

  return timingSafeEqual(provided, expected)
}
