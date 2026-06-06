import { Router } from 'express'
import { z } from 'zod'
import type { AuthRequest } from '../middleware/auth.js'
import { optionalAuth } from '../middleware/auth.js'
import { policyContextFromAuth, productPublicFilter } from '../policies/accessPolicies.js'
import { Product } from '../models/Product.js'
import { cartTotal, clearCart, getCart, resolveCartKey, saveCart } from '../services/cart.js'
import { sendError, sendSuccess } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const cartRouter = Router()

const addItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  quantity: z.number().int().min(1).max(10),
  size: z.string().min(1).max(20),
  color: z.string().min(1).max(50),
})

function getPolicyCtx(req: AuthRequest) {
  return policyContextFromAuth(req.userId, req.currentUser?.role)
}

function resolveAndBindCart(req: AuthRequest, res: import('express').Response): string {
  const ctx = getPolicyCtx(req)
  const cookieCartId = req.cookies?.cartId as string | undefined
  const cartKey = resolveCartKey(ctx, cookieCartId)

  // Logged-in users always use user-scoped cart (prevents cart IDOR via cookie swap)
  if (ctx.userId) {
    res.cookie('cartId', cartKey, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })
  } else if (!cookieCartId) {
    const guestId = cartKey.replace('guest:', '')
    res.cookie('cartId', guestId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })
  }

  return cartKey
}

cartRouter.use(asyncHandler(optionalAuth as (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<void>))

cartRouter.get('/', asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest
  const ctx = getPolicyCtx(authReq)
  const cartKey = resolveAndBindCart(authReq, res)
  const cart = await getCart(cartKey, ctx)
  sendSuccess(res, { ...cart, total: cartTotal(cart.items), itemCount: cart.items.reduce((s, i) => s + i.quantity, 0) })
}))

cartRouter.post('/items', asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest
  const ctx = getPolicyCtx(authReq)
  const parsed = addItemSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    return
  }

  const product = await Product.findOne({ _id: parsed.data.productId, ...productPublicFilter() })
  if (!product) {
    sendError(res, 'Product not found', 404)
    return
  }

  const cartKey = resolveAndBindCart(authReq, res)
  const cart = await getCart(cartKey, ctx)
  const existing = cart.items.find(
    (i) => i.productId === parsed.data.productId && i.size === parsed.data.size && i.color === parsed.data.color,
  )

  if (existing) {
    existing.quantity = Math.min(10, existing.quantity + parsed.data.quantity)
  } else {
    cart.items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: parsed.data.quantity,
      size: parsed.data.size,
      color: parsed.data.color,
      image: product.images[0],
    })
  }

  await saveCart(cartKey, cart, ctx)
  sendSuccess(res, { ...cart, total: cartTotal(cart.items) })
}))

cartRouter.delete('/items/:productId', asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest
  const ctx = getPolicyCtx(authReq)

  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId
  if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
    sendError(res, 'Invalid product ID', 400)
    return
  }

  const cartKey = resolveAndBindCart(authReq, res)
  const cart = await getCart(cartKey, ctx)
  cart.items = cart.items.filter((i) => i.productId !== productId)
  await saveCart(cartKey, cart, ctx)
  sendSuccess(res, { ...cart, total: cartTotal(cart.items) })
}))

cartRouter.delete('/', asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest
  const ctx = getPolicyCtx(authReq)
  const cartKey = resolveAndBindCart(authReq, res)
  await clearCart(cartKey, ctx)
  sendSuccess(res, { items: [], total: 0 })
}))
