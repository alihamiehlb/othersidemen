import { env } from '../config/env.js'

export type PaymentMethod = 'cod' | 'whish' | 'whatsapp'

export interface WhishCheckoutInput {
  orderId: string
  amount: number
  currency: string
  customerName: string
  customerPhone?: string
  returnUrl: string
}

export interface WhishCheckoutResult {
  configured: boolean
  checkoutUrl?: string
  message: string
}

export function isWhishConfigured(): boolean {
  return Boolean(env.WHISH_MERCHANT_ID && env.WHISH_API_KEY && env.WHISH_API_URL)
}

/**
 * Whish Pay merchant API — credentials from Whish Business onboarding.
 * Docs: contact Whish Money for REST API / plugin access (Lebanon).
 */
export async function createWhishCheckout(input: WhishCheckoutInput): Promise<WhishCheckoutResult> {
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
        'X-Merchant-Id': env.WHISH_MERCHANT_ID!,
      },
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

    const data = (await res.json()) as { checkout_url?: string; url?: string }
    const checkoutUrl = data.checkout_url ?? data.url
    if (!checkoutUrl) {
      return { configured: true, message: 'Whish Pay did not return a checkout URL' }
    }

    return { configured: true, checkoutUrl, message: 'Redirect to Whish Pay' }
  } catch {
    return { configured: true, message: 'Whish Pay service unavailable' }
  }
}

export function getPaymentConfig() {
  return {
    whishEnabled: isWhishConfigured(),
    codEnabled: true,
    whatsappEnabled: true,
    stripeNote: 'Stripe merchant accounts are not available in Lebanon — use Whish Pay or COD.',
  }
}
