import { doubleCsrf } from 'csrf-csrf'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { sendError } from '../utils/apiResponse.js'

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  },
  getSessionIdentifier: (req) => (req.cookies?.token as string) ?? req.ip ?? 'anonymous',
})

export { generateCsrfToken }

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next()
    return
  }

  doubleCsrfProtection(req, res, (err?: unknown) => {
    if (err) {
      sendError(res, 'Invalid CSRF token', 403)
      return
    }
    next()
  })
}
