import { Router } from 'express'
import { z } from 'zod'
import type { AuthRequest } from '../middleware/auth.js'
import { requireAuth } from '../middleware/auth.js'
import { validateObjectId } from '../middleware/validateObjectId.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { orderCreateScope, orderListFilter, orderReadFilter, policyContextFromAuth, PolicyError } from '../policies/accessPolicies.js'
import { cartTotal, clearCart, getCart, resolveCartKey, type CartItem } from '../services/cart.js'
import { createWhishCheckout } from '../services/whishPay.js'
import { env } from '../config/env.js'
import { sendError, sendSuccess } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const ordersRouter = Router()

const checkoutSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1).max(100),
    line1: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    country: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    phone: z.string().max(30).optional(),
  }),
  paymentMethod: z.enum(['cod', 'whish', 'whatsapp']).default('cod'),
})

ordersRouter.use(asyncHandler(requireAuth as (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<void>))

ordersRouter.get('/', asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest
  const ctx = policyContextFromAuth(authReq.userId, authReq.currentUser?.role)

  try {
    const filter = orderListFilter(ctx) as Record<string, unknown>
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean()
    sendSuccess(res, orders)
  } catch (err) {
    if (err instanceof PolicyError) { sendError(res, err.message, 403); return }
    throw err
  }
}))

ordersRouter.get('/:id', validateObjectId(), asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest
  const ctx = policyContextFromAuth(authReq.userId, authReq.currentUser?.role)

  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const filter = orderReadFilter(ctx, orderId) as Record<string, unknown>
    const order = await Order.findOne(filter).lean()
    if (!order) {
      sendError(res, 'Order not found', 404)
      return
    }
    sendSuccess(res, order)
  } catch (err) {
    if (err instanceof PolicyError) { sendError(res, err.message, 403); return }
    throw err
  }
}))

ordersRouter.post('/checkout', asyncHandler(async (req, res) => {
  const authReq = req as AuthRequest
  const ctx = policyContextFromAuth(authReq.userId, authReq.currentUser?.role)
  const parsed = checkoutSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    return
  }

  const cartKey = resolveCartKey(ctx, authReq.cookies?.cartId as string | undefined)
  const cart = await getCart(cartKey, ctx)

  if (cart.items.length === 0) {
    sendError(res, 'Cart is empty', 400)
    return
  }

  // Re-validate prices from DB — never trust cached/client-supplied prices
  const productIds = [...new Set(cart.items.map((i) => i.productId))]
  const dbProducts = await Product.find({ _id: { $in: productIds }, isActive: true }).lean()
  const priceMap = new Map(dbProducts.map((p) => [p._id.toString(), p.price]))

  const verifiedItems: CartItem[] = []
  for (const item of cart.items) {
    const dbPrice = priceMap.get(item.productId)
    if (dbPrice === undefined) {
      sendError(res, `Product "${item.name}" is no longer available`, 400)
      return
    }
    verifiedItems.push({ ...item, price: dbPrice })
  }

  const { userId } = orderCreateScope(ctx)
  const subtotal = cartTotal(verifiedItems)
  const shipping = subtotal >= 100 ? 0 : 9.99
  const total = subtotal + shipping
  const paymentMethod = parsed.data.paymentMethod

  const order = await Order.create({
    userId,
    items: verifiedItems.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
    })),
    subtotal,
    shipping,
    total,
    shippingAddress: parsed.data.shippingAddress,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' || paymentMethod === 'whatsapp' ? 'pending' : 'pending',
    status: 'pending',
  })

  let whishCheckoutUrl: string | undefined
  if (paymentMethod === 'whish') {
    const whish = await createWhishCheckout({
      orderId: order.id,
      amount: total,
      currency: 'USD',
      customerName: parsed.data.shippingAddress.fullName,
      customerPhone: parsed.data.shippingAddress.phone,
      returnUrl: `${env.CLIENT_URL}/order/success?orderId=${order.id}`,
    })
    if (whish.checkoutUrl) {
      whishCheckoutUrl = whish.checkoutUrl
      await Order.findByIdAndUpdate(order.id, { whishCheckoutUrl })
    } else if (whish.configured) {
      sendError(res, whish.message, 502)
      return
    } else {
      sendError(res, whish.message, 503)
      return
    }
  }

  await clearCart(cartKey, ctx)
  sendSuccess(res, { order, whishCheckoutUrl }, 201)
}))
