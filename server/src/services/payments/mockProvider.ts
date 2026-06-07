import { randomBytes } from 'crypto'
import type { CheckoutInput, CheckoutResult, PaymentProvider, WebhookResult } from './types.js'

/**
 * Mock provider — default. Lets the whole payment flow run with ZERO real keys.
 * createCheckout sends the shopper straight to the returnUrl (the order success
 * page, which polls payment status). There is no real hosted page, so confirm a
 * "payment" with: POST /api/payments/mock/confirm { orderId }  (dev-only route).
 */
export const mockProvider: PaymentProvider = {
  name: 'mock',

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const paymentRef = `mock_${randomBytes(12).toString('hex')}`

    // returnUrl already carries ?orderId=... — append the ref for traceability.
    let checkoutUrl = input.returnUrl
    try {
      const url = new URL(input.returnUrl)
      url.searchParams.set('ref', paymentRef)
      checkoutUrl = url.toString()
    } catch {
      // returnUrl malformed — fall back to it unchanged rather than failing checkout.
    }

    return {
      configured: true,
      checkoutUrl,
      paymentRef,
      message: 'Mock checkout — confirm via POST /api/payments/mock/confirm',
    }
  },

  verifyWebhook(): WebhookResult {
    // Mock has no real webhook source; confirmation flows through /mock/confirm.
    return { ok: false, paid: false, message: 'Mock provider has no webhook' }
  },
}
