import type { NextFunction, Request, Response } from 'express'
import { sendError } from '../utils/apiResponse.js'
import { PolicyError } from '../policies/accessPolicies.js'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[error]', err.message)

  if (err instanceof PolicyError) {
    sendError(res, 'Forbidden', 403)
    return
  }

  if (err.name === 'ValidationError') {
    sendError(res, err.message, 400)
    return
  }

  if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
    sendError(res, 'Unauthorized', 401)
    return
  }

  const mongoErr = err as { code?: number; keyPattern?: Record<string, number> }
  if (mongoErr.code === 11000) {
    const field = mongoErr.keyPattern ? Object.keys(mongoErr.keyPattern)[0] : 'field'
    sendError(res, `A record with this ${field} already exists`, 409)
    return
  }

  sendError(res, process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message, 500)
}
