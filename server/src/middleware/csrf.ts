import { doubleCsrf } from 'csrf-csrf'
import type { NextFunction, Request, Response } from 'express'
import { cookieOptions } from '../config/cookies.js'
import { env } from '../config/env.js'
import { sendError } from '../utils/apiResponse.js'

const opts = cookieOptions()

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
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
