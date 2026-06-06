import type { NextFunction, Request, Response } from 'express'
import { User, type IUser } from '../models/User.js'
import { sendError } from '../utils/apiResponse.js'
import { verifyToken } from '../utils/jwt.js'

export interface AuthRequest extends Request {
  currentUser?: IUser
  userId?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token as string | undefined

  if (!token) {
    sendError(res, 'Authentication required', 401)
    return
  }

  try {
    const payload = verifyToken(token)
    const user = await User.findById(payload.userId)

    if (!user || !user.isActive) {
      sendError(res, 'Account inactive or not found', 401)
      return
    }

    req.currentUser = user
    req.userId = user.id
    next()
  } catch {
    sendError(res, 'Invalid or expired session', 401)
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token as string | undefined
  if (!token) {
    sendError(res, 'Authentication required', 401)
    return
  }

  try {
    const payload = verifyToken(token)
    const user = await User.findById(payload.userId)
    if (!user || !user.isActive) {
      sendError(res, 'Account inactive or not found', 401)
      return
    }
    if (user.role !== 'admin') {
      sendError(res, 'Admin access required', 403)
      return
    }
    req.currentUser = user
    req.userId = user.id
    next()
  } catch {
    sendError(res, 'Invalid or expired session', 401)
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token as string | undefined
  if (!token) {
    next()
    return
  }

  try {
    const payload = verifyToken(token)
    const user = await User.findById(payload.userId)
    if (user?.isActive) {
      req.currentUser = user
      req.userId = user.id
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next()
}
