/**
 * Payment provider abstraction — Mock (default) + Whish only.
 * Providers NEVER throw: they return a typed result with a `configured` flag
 * and a user-safe `message`. Callers branch on the result, not on exceptions.
 */

export type PaymentProviderName = 'mock' | 'whish'

export interface CheckoutInput {
  orderId: string
  amount: number
  currency: string
  customerName: string
  customerPhone?: string
  /** Where the shopper lands after the hosted checkout (carries orderId). */
  returnUrl: string
}

export interface CheckoutResult {
  /** false → provider has no credentials; caller should fall back to COD/WhatsApp. */
  configured: boolean
  checkoutUrl?: string
  /** Opaque reference used to correlate the later webhook back to the order. */
  paymentRef?: string
  message: string
}

export interface WebhookResult {
  /** true → signature verified and body parsed. false → reject (401/400). */
  ok: boolean
  /** Correlates to Order.paymentRef. */
  paymentRef?: string
  /** Payment succeeded (vs failed/cancelled). Only meaningful when ok === true. */
  paid: boolean
  message: string
}

export interface PaymentProvider {
  readonly name: PaymentProviderName
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>
  /**
   * Verify a raw webhook payload. MUST run on the raw body buffer (pre-JSON,
   * pre-sanitize) so the HMAC matches the bytes the provider signed.
   * Synchronous + never throws.
   */
  verifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): WebhookResult
}
