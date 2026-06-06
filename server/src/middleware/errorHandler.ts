import type { NextFunction, Request, Response } from 'express'
import { sendError } from '../utils/apiResponse.js'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[error]', err.message)

  if (err.name === 'ValidationError') {
    sendError(res, err.message, 400)
    return
  }

  if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
    sendError(res, 'Unauthorized', 401)
    return
  }

  sendError(res, process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message, 500)
}
