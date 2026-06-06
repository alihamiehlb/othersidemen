import { Router } from 'express'
import crypto from 'node:crypto'
import passport from 'passport'
import { z } from 'zod'
import { cookieOptions } from '../config/cookies.js'
import { env } from '../config/env.js'
import type { AuthRequest } from '../middleware/auth.js'
import { requireAuth } from '../middleware/auth.js'
import { csrfProtection } from '../middleware/csrf.js'
import { verifyRecaptcha } from '../middleware/recaptcha.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { User } from '../models/User.js'
import { sendError, sendSuccess } from '../utils/apiResponse.js'
import { signToken } from '../utils/jwt.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import bcrypt from 'bcryptjs'

export const authRouter = Router()

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  captchaToken: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  captchaToken: z.string().optional(),
})

function setAuthCookie(res: import('express').Response, token: string): void {
  res.cookie('token', token, cookieOptions(7 * 24 * 60 * 60 * 1000))
}

authRouter.get('/config', (_req, res) => {
  sendSuccess(res, {
    googleEnabled: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    emailAuthEnabled: true,
  })
})

authRouter.get('/google', authLimiter, (req, res, next) => {
  if (!env.GOOGLE_CLIENT_ID) {
    sendError(res, 'Google OAuth not configured', 503)
    return
  }
  const state = crypto.randomBytes(24).toString('hex')
  res.cookie('oauth_state', state, cookieOptions(10 * 60 * 1000))
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, state })(req, res, next)
})

authRouter.get('/google/callback', authLimiter, (req, res, next) => {
  const state = typeof req.query.state === 'string' ? req.query.state : ''
  const stored = req.cookies?.oauth_state as string | undefined
  res.clearCookie('oauth_state', { path: '/' })

  if (!state || !stored || state !== stored) {
    res.redirect(`${env.CLIENT_URL}/login?error=auth_failed`)
    return
  }

  passport.authenticate('google', { session: false }, (err: Error | null, user: typeof User.prototype | false) => {
    if (err || !user) {
      res.redirect(`${env.CLIENT_URL}/login?error=auth_failed`)
      return
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role })
    setAuthCookie(res, token)
    res.redirect(`${env.CLIENT_URL}/account`)
  })(req, res, next)
})

authRouter.post('/signup', authLimiter, verifyRecaptcha, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    return
  }

  const { email, password, name } = parsed.data
  const existing = await User.findOne({ email })
  if (existing) {
    sendError(res, 'Email already registered', 409)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Only grant admin role when the email matches ADMIN_EMAIL AND no admin account
  // exists yet (first-run bootstrap). After the admin account is created, new
  // signups with that email are impossible (unique constraint above), so this
  // path cannot be triggered again — preventing privilege escalation.
  const isBootstrapAdmin = Boolean(env.ADMIN_EMAIL && email === env.ADMIN_EMAIL)
  const role = isBootstrapAdmin ? 'admin' : 'user'

  const user = await User.create({
    email,
    name,
    passwordHash,
    role,
  })

  const token = signToken({ userId: user.id, email: user.email, role: user.role })
  setAuthCookie(res, token)
  sendSuccess(res, { id: user.id, email: user.email, name: user.name, role: user.role }, 201)
})

authRouter.post('/login', authLimiter, verifyRecaptcha, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, 'Invalid credentials', 400)
    return
  }

  const { email, password } = parsed.data
  const user = await User.findOne({ email })

  if (!user?.passwordHash || !user.isActive) {
    sendError(res, 'Invalid credentials', 401)
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    sendError(res, 'Invalid credentials', 401)
    return
  }

  user.lastLoginAt = new Date()
  await user.save()

  const token = signToken({ userId: user.id, email: user.email, role: user.role })
  setAuthCookie(res, token)
  sendSuccess(res, { id: user.id, email: user.email, name: user.name, role: user.role })
})

authRouter.post('/logout', csrfProtection, (_req, res) => {
  const cleared = cookieOptions()
  res.clearCookie('token', { path: '/', httpOnly: true, sameSite: cleared.sameSite, secure: cleared.secure })
  sendSuccess(res, { message: 'Logged out' })
})

authRouter.get('/me', asyncHandler(requireAuth as (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<void>), (req, res) => {
  const authReq = req as AuthRequest
  const user = authReq.currentUser!
  sendSuccess(res, {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
  })
})
