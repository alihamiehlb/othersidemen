import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'
import { sendError } from '../utils/apiResponse.js'

/**
 * Cloudflare Turnstile token verification.
 *
 * Migration from reCAPTCHA v3:
 *  - Remove RECAPTCHA_SECRET_KEY / VITE_RECAPTCHA_SITE_KEY env vars
 *  - Add TURNSTILE_SECRET_KEY (Workers secret) and VITE_TURNSTILE_SITE_KEY (client build var)
 *  - Replace <script src="https://www.google.com/recaptcha/api.js"> with
 *    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js">
 *  - Replace grecaptcha.execute() calls with window.turnstile.render() or
 *    the invisible Turnstile widget (<div class="cf-turnstile" data-sitekey="...">)
 *  - The widget posts cf-turnstile-response; rename captchaToken → cf-turnstile-response
 *    in your request body (or keep captchaToken as an alias — see below).
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!env.TURNSTILE_SECRET_KEY) {
    // Fail CLOSED in production — if secret is missing the endpoint is unprotected
    if (env.NODE_ENV === 'production') {
      console.error('[turnstile] TURNSTILE_SECRET_KEY is not set — blocking request')
      sendError(res, 'Captcha configuration error', 503)
      return
    }
    next()
    return
  }

  // Accept both field names during the reCAPTCHA → Turnstile migration window
  const token = (req.body?.['cf-turnstile-response'] ?? req.body?.captchaToken) as string | undefined
  if (!token) {
    sendError(res, 'Captcha verification required', 400)
    return
  }

  try {
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      // Bind the token to the client IP for replay-attack prevention
      remoteip: req.ip ?? '',
    })

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!verifyRes.ok) {
      sendError(res, 'Captcha verification unavailable', 503)
      return
    }

    const data = (await verifyRes.json()) as { success?: boolean; 'error-codes'?: string[] }

    if (!data.success) {
      // Log error codes to aid debugging, but never expose them to the client
      console.warn('[turnstile] Verification failed:', data['error-codes'])
      sendError(res, 'Captcha verification failed', 403)
      return
    }

    next()
  } catch (err) {
    console.error('[turnstile] Unexpected error:', err)
    sendError(res, 'Captcha verification unavailable', 503)
  }
}

/** @deprecated Use verifyTurnstile — kept as alias during migration */
export const verifyRecaptcha = verifyTurnstile
