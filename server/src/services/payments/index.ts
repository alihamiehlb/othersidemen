import { env } from '../../config/env.js'
import { mockProvider } from './mockProvider.js'
import { isWhishConfigured, whishProvider } from './whishProvider.js'
import type { PaymentProvider } from './types.js'

export * from './types.js'

/**
 * Single switch for the whole payment system.
 * PAYMENT_MODE=mock (default) → runs with zero real keys.
 * PAYMENT_MODE=live           → real Whish Pay.
 */
export function getProvider(): PaymentProvider {
  return env.PAYMENT_MODE === 'live' ? whishProvider : mockProvider
}

/** Surfaced to the client so the cart can show the right payment options. */
export function getPaymentConfig() {
  // Online pay is testable in mock mode (no keys), and real in live mode once
  // Whish is configured. `whishEnabled` drives whether the cart shows the button.
  const onlineEnabled = env.PAYMENT_MODE === 'mock' || isWhishConfigured()
  return {
    whishEnabled: onlineEnabled,
    paymentMode: env.PAYMENT_MODE,
    codEnabled: true,
    whatsappEnabled: true,
    stripeNote: 'Stripe merchant accounts are not available in Lebanon — use Whish Pay or COD.',
  }
}
