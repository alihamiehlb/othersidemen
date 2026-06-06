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

## Whish Pay setup

1. Register a **Whish Business / merchant** account: [whish.money](https://www.whish.money)
2. Request **Whish Pay API** or Shopify/plugin docs from their merchant team
3. Add to `server/.env`:

```env
WHISH_MERCHANT_ID=your_merchant_id
WHISH_API_KEY=your_api_key
WHISH_API_URL=https://api.whish.money/v1
```

(API URL is an example — use the exact endpoint Whish gives you.)

4. Restart server. Checkout will offer **Pay with Whish** and redirect to their hosted payment page.

## What the code does

- `POST /api/orders/checkout` accepts `paymentMethod`: `cod` | `whish` | `whatsapp`
- **COD / WhatsApp** → order saved as `pending`, customer completes via delivery or chat
- **Whish** → creates order, calls Whish API, returns `whishCheckoutUrl` for redirect

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
