import { env } from '../../config/env.js'
import { verifyHmacSha256 } from './signature.js'
import type { CheckoutInput, CheckoutResult, PaymentProvider, WebhookResult } from './types.js'

/**
 * Whish Pay (Lebanon) merchant integration.
 *
 * ⚠️ BEST-GUESS pending real docs. Whish Money exposes its REST API only through
 * B2B merchant onboarding — there is no public reference. Every field name,
 * header, endpoint path, and the webhook signature scheme below is a best guess
 * ported from the previous whishPay.ts. VERIFY against the Whish integration
 * packet before flipping PAYMENT_MODE=live, and adjust the marked lines.
 */

// BEST-GUESS — confirm exact header name with Whish.
const WHISH_SIGNATURE_HEADER = 'x-whish-signature'

export function isWhishConfigured(): boolean {
  return Boolean(env.WHISH_MERCHANT_ID && env.WHISH_API_KEY && env.WHISH_API_URL)
}

interface WhishCheckoutResponse {
  checkout_url?: string
  url?: string
  payment_ref?: string
  id?: string
}

interface WhishWebhookBody {
  order_id?: string
  payment_ref?: string
  id?: string
  status?: string
}

export const whishProvider: PaymentProvider = {
  name: 'whish',

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!isWhishConfigured()) {
      return {
        configured: false,
        message: 'Whish Pay is not configured. Use Cash on Delivery or WhatsApp order for now.',
      }
    }

    try {
      const res = await fetch(`${env.WHISH_API_URL}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.WHISH_API_KEY}`,
          'X-Merchant-Id': env.WHISH_MERCHANT_ID!, // BEST-GUESS header
        },
        // BEST-GUESS request body shape.
        body: JSON.stringify({
          merchant_id: env.WHISH_MERCHANT_ID,
          order_id: input.orderId,
          amount: input.amount,
          currency: input.currency,
          customer_name: input.customerName,
          customer_phone: input.customerPhone,
          return_url: input.returnUrl,
        }),
      })

      if (!res.ok) {
        return { configured: true, message: 'Whish Pay session could not be created' }
      }

      const data = (await res.json()) as WhishCheckoutResponse
      const checkoutUrl = data.checkout_url ?? data.url
      if (!checkoutUrl) {
        return { configured: true, message: 'Whish Pay did not return a checkout URL' }
      }

      // BEST-GUESS ref field; fall back to our orderId (also sent as order_id).
      const paymentRef = data.payment_ref ?? data.id ?? input.orderId
      return { configured: true, checkoutUrl, paymentRef, message: 'Redirect to Whish Pay' }
    } catch {
      return { configured: true, message: 'Whish Pay service unavailable' }
    }
  },

  verifyWebhook(rawBody, headers): WebhookResult {
    const secret = env.WHISH_WEBHOOK_SECRET
    if (!secret) {
      return { ok: false, paid: false, message: 'WHISH_WEBHOOK_SECRET not configured' }
    }

    const headerVal = headers[WHISH_SIGNATURE_HEADER]
    const signature = Array.isArray(headerVal) ? headerVal[0] : headerVal
    if (!signature || !verifyHmacSha256(secret, rawBody, signature)) {
      return { ok: false, paid: false, message: 'Invalid webhook signature' }
    }

    // Parse only AFTER the signature passes. BEST-GUESS payload shape.
    try {
      const body = JSON.parse(rawBody.toString('utf8')) as WhishWebhookBody
      const paymentRef = body.payment_ref ?? body.id ?? body.order_id
      const paid = body.status === 'paid' || body.status === 'success' || body.status === 'completed'
      return {
        ok: true,
        paymentRef,
        paid,
        message: paid ? 'paid' : `status=${body.status ?? 'unknown'}`,
      }
    } catch {
      return { ok: false, paid: false, message: 'Malformed webhook body' }
    }
  },
}
