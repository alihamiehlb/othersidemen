import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'
import { sendError } from '../utils/apiResponse.js'

export async function verifyRecaptcha(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!env.RECAPTCHA_SECRET_KEY) {
    next()
    return
  }

  const token = req.body?.captchaToken as string | undefined
  if (!token) {
    sendError(res, 'Captcha verification required', 400)
    return
  }

  try {
    const params = new URLSearchParams({
      secret: env.RECAPTCHA_SECRET_KEY,
      response: token,
    })
    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    const data = (await verifyRes.json()) as { success?: boolean; score?: number }
    if (!data.success || (data.score ?? 0) < 0.5) {
      sendError(res, 'Captcha verification failed', 403)
      return
    }
    next()
  } catch {
    sendError(res, 'Captcha verification unavailable', 503)
  }
}
