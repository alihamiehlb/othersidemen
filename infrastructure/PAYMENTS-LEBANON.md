# Payments in Lebanon — Whish Pay vs Stripe

## Short answer

**Use Whish Pay (or Cash on Delivery + WhatsApp)** for Lebanon. **Stripe is not available** for Lebanese merchant accounts in the traditional way — you cannot rely on Stripe as your primary local checkout.

This project is wired for:

| Method | Status | Best for |
|--------|--------|----------|
| **Whish Pay** | Ready when you add merchant API keys | Online wallet checkout in Lebanon |
| **Cash on Delivery (COD)** | Enabled now | Local delivery, no gateway needed |
| **WhatsApp order** | Enabled now | Manual confirmation, very common in LB |
| **Stripe** | Not recommended for LB merchants | Use only if you have a foreign entity |

## Mock mode vs live mode (PAYMENT_MODE)

The payment system runs behind a single provider switch — `PAYMENT_MODE`:

| Mode | Value | Behaviour |
|------|-------|-----------|
| **Mock** (default) | `PAYMENT_MODE=mock` or unset | No real keys needed. Online checkout returns a fake URL straight to the order success page; confirm a "payment" with the dev-only route below. |
| **Live** | `PAYMENT_MODE=live` | Real Whish Pay. Requires `WHISH_*` secrets. |

This lets the full flow run end-to-end today with **zero real API keys**, and flip to live by setting one env var once the client delivers credentials.

### Mock flow (works now, no keys)

1. Checkout with the online option → server returns a `checkoutUrl` pointing at `/order/success?orderId=…&ref=mock_…`
2. The success page **polls** `GET /api/payments/:orderId/status` (it does NOT trust the URL)
3. Simulate the gateway callback (dev only):
   ```bash
   curl -X POST localhost:3001/api/payments/mock/confirm \
     -H 'Content-Type: application/json' \
     -d '{"orderId":"<ORDER_ID>"}'
   ```
4. The polling success page flips to **paid**.

> `POST /api/payments/mock/confirm` is registered **only when NODE_ENV !== 'production'**. It cannot exist in prod.

## Whish Pay setup (live)

1. Register a **Whish Business / merchant** account: [whish.money](https://www.whish.money)
2. Request **Whish Pay API** docs from their merchant team (REST + webhook spec + signature scheme)
3. Add to `server/.env` (or Cloudflare Worker secrets):

```env
PAYMENT_MODE=live
WHISH_MERCHANT_ID=your_merchant_id
WHISH_API_KEY=your_api_key
WHISH_API_URL=https://api.whish.money/v1   # exact endpoint comes from Whish
WHISH_WEBHOOK_SECRET=shared_secret_whish_signs_with
```

4. Restart server. Checkout offers **Pay with Whish** and redirects to their hosted page.

### Webhook URL to give Whish

```
POST https://<your-api-domain>/api/payments/webhook
```

- Receives the raw body (mounted before JSON parsing) so the **HMAC-SHA256** signature verifies against the exact bytes Whish signed.
- Idempotent: a retried webhook for an already-paid order returns `200` without double-processing (Whish **will** retry).
- Rejects bad/absent signatures with `401`.

> ⚠️ **BEST-GUESS fields, verify before go-live.** Whish has no public REST reference,
> so the request body, the auth headers, the webhook payload shape, and the signature
> header name (`x-whish-signature`) in `server/src/services/payments/whishProvider.ts`
> are best guesses ported from the old code. Every guess is marked `BEST-GUESS` in that
> file — reconcile each against the real Whish integration packet, then re-test the
> webhook accept path.

## What the code does

- `POST /api/orders/checkout` accepts `paymentMethod`: `cod` | `whish` | `whatsapp`
- **COD / WhatsApp** → order saved as `pending`; success page shows "we'll confirm" (no polling)
- **Online (`whish`)** → creates order, calls `getProvider().createCheckout`, stores `paymentRef` + `paymentProvider`, returns `whishCheckoutUrl` for redirect
- Provider code: `server/src/services/payments/` (`mockProvider`, `whishProvider`, `signature`, `index` = `getProvider()`)

## Flip mock → live (key handoff checklist)

- [ ] Whish merchant account approved, API + webhook docs received
- [ ] Set `WHISH_MERCHANT_ID`, `WHISH_API_KEY`, `WHISH_API_URL`, `WHISH_WEBHOOK_SECRET` in Worker secrets
- [ ] Reconcile every `BEST-GUESS` line in `whishProvider.ts` against the real Whish docs (request body, headers, webhook shape, signature header name + algo)
- [ ] Register webhook URL `https://<api-domain>/api/payments/webhook` in the Whish dashboard
- [ ] Set `PAYMENT_MODE=live`
- [ ] Test on staging: checkout → real Whish page → pay → webhook flips order to paid; success page polling confirms
- [ ] Verify a duplicate/retried webhook is idempotent and a tampered signature returns 401

## Cash on Delivery flow (live today)

1. Customer checks out with **Cash on Delivery**
2. Order stored in MongoDB with `paymentMethod: cod`
3. Admin fulfills from `/admin/orders`

## WhatsApp flow (live today)

1. Set `VITE_WHATSAPP_NUMBER` in `client/.env.development`
2. Product modal / product page → **Order on WhatsApp**
3. Optional: choose **WhatsApp** at checkout for order confirmation message

## Why not store images in MongoDB?

Images are **not** stored in MongoDB. Only **URLs** are stored, e.g. `/images/catalog/tops/os-2024-12-24-03.webp`.

The actual files live on **Cloudflare Pages** (static assets). MongoDB only stores text paths — this is correct and scales well. No drawback for 791+ items.

## Production payment checklist

- [ ] Whish merchant account approved
- [ ] API keys in Cloudflare Worker secrets / server env
- [ ] Test COD + Whish on staging
- [ ] WhatsApp business number in `VITE_WHATSAPP_NUMBER`
- [ ] Order confirmation emails (future)
