# Payment Integration — Handoff

> Single source of truth for the OTHER SIDE payment system. Audience: a dev who
> knows React/Express/TS but not this codebase. For the Lebanon payment-methods
> rationale (Whish vs Stripe, COD, WhatsApp) and the live key-handoff checklist,
> see [`infrastructure/PAYMENTS-LEBANON.md`](../infrastructure/PAYMENTS-LEBANON.md) — this doc does not repeat it.

## TL;DR

- Provider-agnostic checkout (**Mock + Whish only**) behind a `PAYMENT_MODE` env switch; payment is confirmed by a **server-verified webhook**, not by the browser redirect.
- State: **verified locally end-to-end (5/5), pending real Whish credentials.** Runs today in mock mode with zero keys.
- Pending: 4 `BEST-GUESS` Whish field/header/signature details to confirm against real Whish docs before `PAYMENT_MODE=live` (see [Open follow-ups](#open-follow-ups)).

## The problem we fixed

**Old flow (fraud bug):** the browser was redirected to `/order/success` and the
order was treated as paid based on that return / a query param. Anyone could hit
the success URL (or forge the param) and get an order marked paid **without
paying**. The client is untrusted; it must never be the source of truth for payment.

**New flow:** the browser redirect is cosmetic. The order flips to `paid` only when
the **payment provider calls our webhook** and the server **verifies an HMAC-SHA256
signature** over the raw request body. The success page **polls** an owner-scoped
status endpoint and reflects whatever the server already decided — it never sets it.

```
Old:  browser → /order/success?paid=1        → DB paid     ❌ client-trusted
New:  provider → POST /webhook (HMAC verify)  → DB paid     ✅ server-verified
      browser  → polls GET /:orderId/status   → shows state
```

## Architecture

One `PaymentProvider` interface, two implementations, selected by `PAYMENT_MODE`.
Providers **never throw** — they return typed results; callers branch on the result.

### Provider interface (`server/src/services/payments/types.ts`)

```ts
export type PaymentProviderName = 'mock' | 'whish'

export interface CheckoutInput {
  orderId: string
  amount: number
  currency: string
  customerName: string
  customerPhone?: string
  returnUrl: string   // where the shopper lands after checkout (carries orderId)
}

export interface CheckoutResult {
  configured: boolean       // false → no credentials; caller falls back to COD/WhatsApp
  checkoutUrl?: string
  paymentRef?: string       // opaque ref correlating the later webhook to the order
  message: string
}

export interface WebhookResult {
  ok: boolean               // true → signature verified + body parsed; false → reject (401/400)
  paymentRef?: string       // correlates to Order.paymentRef
  paid: boolean             // payment succeeded (only meaningful when ok === true)
  message: string
}

export interface PaymentProvider {
  readonly name: PaymentProviderName
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>
  verifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): WebhookResult           // runs on RAW body, synchronous, never throws
}
```

### Mock provider (`mockProvider.ts`) — default

Exists so the **entire flow runs with zero real keys** (build/test before the
client delivers Whish access). `createCheckout` mints `paymentRef = mock_<hex>` and
returns the `returnUrl` (the order success page) with `?ref=` appended — there is no
real hosted page. `verifyWebhook` always returns `ok:false` (mock has no real
webhook); confirmation goes through the dev-only `POST /api/payments/mock/confirm`.

### Whish provider (`whishProvider.ts`) — real impl

Ported from the old `whishPay.ts`. `createCheckout` POSTs to the Whish checkout
endpoint and returns its hosted `checkoutUrl` + `paymentRef`. `verifyWebhook`
requires `WHISH_WEBHOOK_SECRET`, reads the signature header, runs timing-safe
HMAC-SHA256 over the raw body, and **only parses JSON after the signature passes**.

> ⚠️ Every Whish field name, header, endpoint path, and the signature header
> (`x-whish-signature`) is marked **`BEST-GUESS`** in this file — no public Whish REST
> reference exists. Reconcile against the real Whish packet before going live.

### Selection (`index.ts`)

```ts
export function getProvider(): PaymentProvider {
  return env.PAYMENT_MODE === 'live' ? whishProvider : mockProvider
}
```

`PAYMENT_MODE` is `mock` (default) or `live`. `getPaymentConfig()` also lives here
and tells the cart whether to show the online-pay button (`whishEnabled`: true in
mock mode, or in live mode once Whish env is set).

### Full flow

```
┌──────────┐  POST /api/orders/checkout (paymentMethod: whish)   ┌──────────┐
│  Client  │ ─────────────────────────────────────────────────► │  Server  │
│  (cart)  │                                                     │          │
│          │   getProvider().createCheckout()                    │  creates │
│          │   → order saved pending + paymentRef + provider     │  Order   │
│          │ ◄───────────── { whishCheckoutUrl } ─────────────── │          │
└────┬─────┘                                                     └────┬─────┘
     │ window.location = checkoutUrl                                   │
     ▼                                                                 │
┌──────────────────────┐   (mock: straight to success page)           │
│  Provider hosted page │   (live: real Whish payment page)            │
└────┬─────────────────┘                                              │
     │ pays                                                            │
     ▼                                                                 │
┌──────────┐  POST /api/payments/webhook  (raw body + signature)      │
│ Provider │ ─────────────────────────────────────────────────────►  │ verify HMAC
│          │                                                          │ → settle paid
│          │ ◄──────────────── 200 received ───────────────────────  │ (atomic, idempotent)
└──────────┘                                                          │
                                                                      │
┌──────────┐  redirect → /order/success?orderId=…                    │
│  Client  │  GET /api/payments/:orderId/status  (poll every 2s) ───► │ owner-scoped read
│ success  │ ◄──────── { paymentStatus, paidAt } ───────────────────  │
│  page    │  spinner → "Payment confirmed" when paymentStatus=paid   │
└──────────┘
```

Mock mode collapses the provider+webhook hop into the dev-only `POST /mock/confirm`,
which performs the identical atomic settle the webhook does.

## Files changed

| Path | Action | Why |
|------|--------|-----|
| `server/src/services/payments/types.ts` | NEW | `PaymentProvider` interface + shared types |
| `server/src/services/payments/signature.ts` | NEW | Timing-safe HMAC-SHA256 verify (raw body), never throws |
| `server/src/services/payments/mockProvider.ts` | NEW | Default provider; keyless dev flow |
| `server/src/services/payments/whishProvider.ts` | NEW | Real Whish impl (ported); all fields marked `BEST-GUESS` |
| `server/src/services/payments/index.ts` | NEW | `getProvider()` switch + `getPaymentConfig()` |
| `server/src/services/whishPay.ts` | DELETED | Logic moved into `whishProvider.ts` + `index.ts` |
| `server/src/routes/payments.ts` | MODIFIED | + webhook handler, owner-scoped `/:orderId/status`, dev-only `/mock/confirm`, atomic `settleOrderPaid` |
| `server/src/routes/orders.ts` | MODIFIED | Checkout calls `getProvider().createCheckout`; stores `paymentRef` + `paymentProvider` |
| `server/src/routes/health.ts` | MODIFIED | `getPaymentConfig` import moved off deleted `whishPay.ts` |
| `server/src/models/Order.ts` | MODIFIED | + `paymentRef` (unique sparse), `paymentProvider`, `paidAt` |
| `server/src/config/env.ts` | MODIFIED | + `PAYMENT_MODE` (mock\|live, default mock), `WHISH_WEBHOOK_SECRET` |
| `server/src/index.ts` | MODIFIED | Raw-body webhook mount before json/sanitize/hpp; `assertPaymentConfig()` startup guard |
| `server/src/middleware/rateLimit.ts` | MODIFIED | + `webhookLimiter` (60/min) |
| `client/src/pages/OrderSuccessPage.tsx` | MODIFIED | Polls status instead of trusting the query param |
| `.env.production.example` | MODIFIED | Documents `PAYMENT_MODE` + `WHISH_*` |
| `infrastructure/PAYMENTS-LEBANON.md` | MODIFIED | Mock/live modes, webhook URL, flip checklist |

## How to run locally (zero keys)

```bash
cd othersidemen
docker compose up mongodb redis -d        # or: docker-compose up mongodb redis -d
```

Minimum `server/.env` (mock mode — no Whish keys needed):

```env
NODE_ENV=development
PORT=3001
PAYMENT_MODE=mock
MONGODB_URI=mongodb://localhost:27017/twoside-store
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-only-secret-change-in-production-32chars
CSRF_SECRET=dev-only-csrf-secret-change-in-prod-32c
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

```bash
npm install
npm run seed -w server      # seeds products + admin@otherside.com / Admin123!Change
npm run dev                 # client :5173, server :3001
```

Browser flow:

1. http://localhost:5173 → log in (`admin@otherside.com` / `Admin123!Change`)
2. Add an item → cart → checkout → pick the online ("Whish Pay") option → Place order
3. Land on `/order/success?orderId=<ID>&ref=mock_…` — spinner "Confirming payment"
4. Confirm the mock payment:
   ```bash
   curl -X POST localhost:3001/api/payments/mock/confirm \
     -H 'Content-Type: application/json' -d '{"orderId":"<ID>"}'
   ```
5. Success page flips "Confirming…" → "Payment confirmed" within ~2-4s.

To get `<ID>` without the browser, read the latest order from Mongo:

```bash
docker compose exec mongodb mongosh twoside-store --quiet --eval \
  'db.orders.find({},{paymentStatus:1,status:1,paymentRef:1,paidAt:1}).sort({createdAt:-1}).limit(1).toArray()'
```

## How we tested it

Verified locally on Docker (mongo:7 + redis:7), 2026-06-07. Actual outputs:

| Block | What it proves | Command | Expected | Result |
|-------|----------------|---------|----------|--------|
| **A. Boot** | Stack runs, data seeds | `docker compose up …` + `npm run seed` | services up, catalog seeded | ✅ 6 products + admin |
| **B. Happy path** | Webhook/confirm settles the order | `curl POST /mock/confirm {orderId}` then read DB | DB paid, page flips | ✅ `paymentStatus=paid`, `status=paid`, `paidAt=2026-06-07T16:46:42.161Z`; page → "Payment confirmed" |
| **C. Idempotency** | Retry can't double-settle | call `/mock/confirm` twice, compare `paidAt` | 2nd ok, `paidAt` unchanged | ✅ same `paidAt` `2026-06-07T16:46:42.161Z` both calls |
| **D. Signature** | Forged webhooks rejected | `POST /webhook` bad / none / valid HMAC (live mode, secret=test) | bad 401, none 401, valid 200 | ✅ bad-sig **401**, no-sig **401**, good-sig **200** |
| **E. Prod guard** | Dev confirm route absent in prod | `NODE_ENV=production` then `POST /mock/confirm` | 404 | ✅ **404** (route not registered) |

Also: `tsc` + build clean on both `server` and `client`.

## Security model

**Raw body for the webhook (middleware ordering).** HMAC is computed over the exact
bytes the provider sent. `express.json()`, `mongoSanitize()`, and `hpp()` all
re-serialize / mutate the parsed body, which changes the bytes and breaks signature
verification. So the webhook route is mounted in `server/src/index.ts` with
`express.raw()` **before** those middlewares; `verifyWebhook` receives a `Buffer`.

**HMAC + timing-safe compare.** `signature.ts` recomputes `HMAC-SHA256(secret, rawBody)`
and compares with `crypto.timingSafeEqual` (constant-time) so an attacker can't
byte-by-byte guess a valid signature via timing. Malformed/length-mismatched input
returns `false` rather than throwing. Without a valid signature the webhook is `401`.

**Idempotency (`findOneAndUpdate` + `$ne:'paid'`).** Providers retry webhooks. The
paid transition is a single atomic Mongo update with the precondition
`paymentStatus: { $ne: 'paid' }` baked into the query filter — concurrent retries
can't both win, so `paidAt` is stamped once and side effects fire once. An already-paid
retry is acked with `200 idempotent` (no re-processing).

**Dev-only mock route is guarded at registration.** `POST /api/payments/mock/confirm`
is wrapped in `if (env.NODE_ENV !== 'production')`, so in production the route is
**never registered** — it returns `404`, not a guarded `403`. There is no code path to
flip an order paid without a verified provider webhook in prod.

**Client polls instead of trusting the redirect.** `OrderSuccessPage` reads
`GET /api/payments/:orderId/status` (owner-scoped via the order policy filter) and
renders whatever the server already decided. The query param is never used to mark
payment — it only carries the `orderId` to poll. This is the core fix for the original
fraud bug.

## Going live

When the client delivers Whish credentials (full checklist:
[`infrastructure/PAYMENTS-LEBANON.md`](../infrastructure/PAYMENTS-LEBANON.md#flip-mock--live-key-handoff-checklist)):

1. **Get from client:** `WHISH_API_KEY`, `WHISH_MERCHANT_ID`, `WHISH_API_URL`,
   `WHISH_WEBHOOK_SECRET` (+ any `WHISH_CHANNEL` Whish requires), the **real webhook
   signature header name**, and the **real webhook body field names**.
2. **Reconcile every `BEST-GUESS` line** in `server/src/services/payments/whishProvider.ts`
   against the real Whish docs (request body, auth headers, response/ webhook shape,
   signature header + algorithm).
3. **Set prod env:** `PAYMENT_MODE=live` + all `WHISH_*` vars. (Startup fails fast in
   production if any are missing — see `assertPaymentConfig()` in `index.ts`.)
4. **Give the client the webhook URL:** `https://<prod-domain>/api/payments/webhook`.
5. **Test one small real transaction** end-to-end before going public; confirm a
   duplicate webhook is idempotent and a tampered signature returns 401.

State stays **verified locally, pending real Whish credentials** until steps 1-5 pass on staging.

## Open follow-ups

The 4 `BEST-GUESS` items in `whishProvider.ts` to confirm against real Whish docs:

1. **Signature header name** — currently `x-whish-signature` (`WHISH_SIGNATURE_HEADER`).
2. **Webhook body field names** — currently `order_id` / `payment_ref` / `id` / `status` (`WhishWebhookBody`); `paid` is inferred from `status ∈ {paid, success, completed}`.
3. **createCheckout request shape** — body (`merchant_id`, `order_id`, `amount`, `currency`, `customer_name`, `customer_phone`, `return_url`) + headers (`Authorization: Bearer`, `X-Merchant-Id`) + endpoint path (`${WHISH_API_URL}/checkout`).
4. **Credentials/values** — `WHISH_API_KEY`, `WHISH_MERCHANT_ID`, `WHISH_API_URL`, `WHISH_WEBHOOK_SECRET` (+ any `WHISH_CHANNEL`) from the client; set in prod env and flip `PAYMENT_MODE=live`.

## File map

```
server/src/
├── services/payments/
│   ├── types.ts          # PaymentProvider interface + CheckoutInput/Result, WebhookResult
│   ├── signature.ts      # hmacSha256Hex + timing-safe verifyHmacSha256
│   ├── mockProvider.ts   # default; keyless dev flow
│   ├── whishProvider.ts  # real Whish (BEST-GUESS fields) + isWhishConfigured()
│   └── index.ts          # getProvider() switch + getPaymentConfig()
├── routes/
│   ├── payments.ts       # /config, /:orderId/status, /mock/confirm (dev), webhookHandler, settleOrderPaid
│   └── orders.ts         # checkout → getProvider().createCheckout
├── models/Order.ts       # + paymentRef (unique sparse), paymentProvider, paidAt
├── config/env.ts         # + PAYMENT_MODE, WHISH_WEBHOOK_SECRET
├── middleware/rateLimit.ts  # + webhookLimiter
└── index.ts              # raw webhook mount (pre-json) + assertPaymentConfig()

client/src/pages/OrderSuccessPage.tsx   # polls /:orderId/status

infrastructure/PAYMENTS-LEBANON.md      # methods rationale + live key-handoff checklist
docs/PAYMENT-INTEGRATION.md             # this file
```
