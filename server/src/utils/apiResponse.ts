import type { Response } from 'express'

interface ApiSuccess<T> {
  success: true
  data: T
  error: null
  meta?: Record<string, unknown>
}

interface ApiError {
  success: false
  data: null
  error: string
}

export function sendSuccess<T>(res: Response, data: T, status = 200, meta?: Record<string, unknown>): void {
  const body: ApiSuccess<T> = { success: true, data, error: null }
  if (meta) body.meta = meta
  res.status(status).json(body)
}

export function sendError(res: Response, message: string, status = 400): void {
  const body: ApiError = { success: false, data: null, error: message }
  res.status(status).json(body)
}
