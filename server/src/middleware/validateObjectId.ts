import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { sendError } from '../utils/apiResponse.js'

export function validateObjectId(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const raw = req.params[paramName]
    const id = Array.isArray(raw) ? raw[0] : raw
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid resource ID', 400)
      return
    }
    next()
  }
}
