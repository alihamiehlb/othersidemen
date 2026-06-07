import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import type { AuthRequest } from '../middleware/auth.js'
import { requireAuth } from '../middleware/auth.js'
import { validateObjectId } from '../middleware/validateObjectId.js'
import type { HydratedDocument } from 'mongoose'
import { Order, type IOrder } from '../models/Order.js'
import { orderReadFilter, policyContextFromAuth, PolicyError } from '../policies/accessPolicies.js'
import { getPaymentConfig, getProvider } from '../services/payments/index.js'
import { sendError, sendSuccess } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const paymentsRouter = Router()

/**
 * Atomically flip a not-yet-paid order to paid. The `paymentStatus: { $ne: 'paid' }`
 * precondition lives inside the query, so concurrent webhook retries cannot both
 * win the transition (no read-then-write race). Returns the updated doc when this
 * call performed the transition, or null if the order was missing or already paid.
 */
async function settleOrderPaid(
  filter: Record<string, unknown>,
  source: string,
): Promise<HydratedDocument<IOrder> | null> {
  const order = await Order.findOneAndUpdate(
    { ...filter, paymentStatus: { $ne: 'paid' } },
    { $set: { paymentStatus: 'paid', status: 'paid', paidAt: new Date() } },
    { new: true },
  )
  if (order) {
    console.log(JSON.stringify({
      evt: 'payment.paid',
      source,
      orderId: order.id,
      paymentRef: order.paymentRef,
      provider: order.paymentProvider,
      at: order.paidAt?.toISOString(),
    }))
  }
  return order
}

paymentsRouter.get('/config', (_req, res) => {
  sendSuccess(res, getPaymentConfig())
})

/**
 * Owner-scoped payment status — the client polls this after returning from
 * checkout instead of trusting a query param.
 */
paymentsRouter.get(
  '/:orderId/status',
  validateObjectId('orderId'),
  asyncHandler(requireAuth as (req: Request, res: Response, next: import('express').NextFunction) => Promise<void>),
  asyncHandler(async (req, res) => {
    const authReq = req as AuthRequest
    const ctx = policyContextFromAuth(authReq.userId, authReq.currentUser?.role)
    try {
      const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId
      const filter = orderReadFilter(ctx, orderId) as Record<string, unknown>
      const order = await Order.findOne(filter).select('paymentStatus paymentMethod paidAt').lean()
      if (!order) {
        sendError(res, 'Order not found', 404)
        return
      }
      sendSuccess(res, {
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt ?? null,
      })
    } catch (err) {
      if (err instanceof PolicyError) { sendError(res, err.message, 403); return }
      throw err
    }
  }),
)

/**
 * Dev-only manual confirmation — stands in for the provider webhook in mock mode.
 * Registered ONLY outside production (see guard below) so it can never flip a
 * real order paid in prod.
 */
const mockConfirmSchema = z.object({ orderId: z.string().min(1) })

if (env.NODE_ENV !== 'production') {
  paymentsRouter.post('/mock/confirm', asyncHandler(async (req, res) => {
    const parsed = mockConfirmSchema.safeParse(req.body)
    if (!parsed.success) {
      sendError(res, 'orderId is required', 400)
      return
    }
    const existing = await Order.findById(parsed.data.orderId)
    if (!existing) {
      sendError(res, 'Order not found', 404)
      return
    }
    const settled = await settleOrderPaid({ _id: existing._id }, 'mock/confirm')
    const order = settled ?? existing
    sendSuccess(res, { orderId: order.id, paymentStatus: order.paymentStatus, paidAt: order.paidAt ?? null })
  }))
}

/**
 * Provider webhook. Mounted in index.ts with express.raw() BEFORE express.json /
 * mongoSanitize / hpp so the HMAC sees the exact bytes the provider signed.
 * Never throws to the client; idempotent on the order's paid state.
 */
export async function webhookHandler(req: Request, res: Response): Promise<void> {
  try {
    const provider = getProvider()
    const raw: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from('')
    const result = provider.verifyWebhook(raw, req.headers)

    if (!result.ok) {
      console.warn(JSON.stringify({ evt: 'payment.webhook_rejected', provider: provider.name, reason: result.message }))
      sendError(res, 'Invalid webhook', 401)
      return
    }
    if (!result.paymentRef) {
      sendError(res, 'Missing payment reference', 400)
      return
    }

    if (result.paid) {
      const settled = await settleOrderPaid({ paymentRef: result.paymentRef }, 'webhook')
      if (settled) {
        sendSuccess(res, { received: true })
        return
      }
      // Atomic settle did nothing: order is either already paid (idempotent retry)
      // or no order maps to this ref. Both are safe to ack so the provider stops.
      const exists = await Order.exists({ paymentRef: result.paymentRef })
      if (exists) {
        sendSuccess(res, { received: true, idempotent: true })
      } else {
        console.warn(JSON.stringify({ evt: 'payment.webhook_no_order', paymentRef: result.paymentRef }))
        sendSuccess(res, { received: true })
      }
      return
    }

    // Failed/cancelled callback — mark failed only if not already paid.
    const failed = await Order.findOneAndUpdate(
      { paymentRef: result.paymentRef, paymentStatus: { $ne: 'paid' } },
      { $set: { paymentStatus: 'failed' } },
      { new: true },
    )
    if (failed) {
      console.log(JSON.stringify({ evt: 'payment.failed', orderId: failed.id, paymentRef: failed.paymentRef }))
    }
    sendSuccess(res, { received: true })
  } catch (err) {
    // Internal error → 500 so the provider retries later (handler is idempotent).
    console.error('[payments] webhook handler error:', err)
    sendError(res, 'Webhook processing error', 500)
  }
}
