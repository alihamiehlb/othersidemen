# Production checklist

Run before deploy to Cloudflare.

## Environment

```powershell
# Server (Cloudflare Worker secrets or server/.env)
MONGODB_URI=          # Atlas production cluster
REDIS_URL=            # Upstash rediss://
JWT_SECRET=           # 32+ random chars
CSRF_SECRET=          # 32+ random chars
CORS_ORIGIN=          # https://your-domain.com
CLIENT_URL=           # https://your-domain.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=  # https://api.your-domain.com/api/auth/google/callback
RECAPTCHA_SECRET_KEY= # optional but recommended
WHISH_MERCHANT_ID=    # optional until Whish onboarding
WHISH_API_KEY=
WHISH_API_URL=

# Client (Cloudflare Pages env)
VITE_WHATSAPP_NUMBER=
VITE_RECAPTCHA_SITE_KEY=
```

## Health checks

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Full status: MongoDB, Redis, OAuth, captcha, Whish |
| `GET /api/health/ready` | DB ready (for load balancers) |
| `GET /api/health/live` | Process alive |

```powershell
curl http://localhost:3001/api/health
```

Expected: `"mongodb": "connected"`, `"redis": "connected"` (or `"disabled"` if no Redis URL).

## Images

- 791 catalog WebPs in `client/public/images/catalog/`
- MongoDB stores **paths only** — not binary files
- Deploy includes static assets via Cloudflare Pages build

## Security

- [ ] Rotate JWT/CSRF secrets for production
- [ ] Atlas IP allowlist or `0.0.0.0/0` with strong DB user password
- [ ] reCAPTCHA on login/signup
- [ ] HTTPS only (Cloudflare handles this)
- [ ] Admin password changed from default

## Commands

```powershell
npm run build
npm run import-catalog        # if re-processing images
npm run import-catalog:db     # sync MongoDB
```

## Google OAuth

See [google-oauth.md](./google-oauth.md) — add JavaScript origins **and** redirect URIs.

## Payments (Lebanon)

See [PAYMENTS-LEBANON.md](./PAYMENTS-LEBANON.md) — Whish Pay + COD, not Stripe.
