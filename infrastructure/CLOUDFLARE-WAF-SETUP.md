# Cloudflare WAF + DDoS setup (OTHER SIDE)

Apply in [Cloudflare Dashboard](https://dash.cloudflare.com) for your domain or account.

## 1. Turnstile (captcha)

1. **Turnstile** → Add site → **Invisible** widget
2. Domains: `twoside-store.pages.dev` (+ custom domain later)
3. Copy **Site key** → GitHub secret / build env `VITE_TURNSTILE_SITE_KEY`
4. Copy **Secret key** → Worker secret:
   ```powershell
   cd cloudflare\api
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
5. Rebuild & redeploy Pages after setting site key.

## 2. HTTP DDoS protection

**Security → Settings**

| Setting | Value |
|---------|--------|
| Security Level | Medium or High |
| Bot Fight Mode | On |
| Browser Integrity Check | On |

**Security → DDoS** → HTTP DDoS sensitivity: **High**

## 3. Rate limiting (edge — before API)

**Security → WAF → Rate limiting rules**

| Rule | Match | Action |
|------|-------|--------|
| Auth brute force | URI Path contains `/api/auth` AND Method equals POST | Block, 10 req / 1 min / IP |
| API flood | URI Path starts with `/api/` | Managed challenge or block, 100 req / 1 min / IP |
| Admin | URI Path starts with `/admin` or `/api/admin` | Block, 30 req / 1 min / IP |

## 4. Managed rules

**Security → WAF → Managed rules** → Enable **Cloudflare Managed Ruleset** (free on Pro+; check your plan).

## 5. SSL

**SSL/TLS** → Full (strict), Always Use HTTPS ON, HSTS enabled (app also sends HSTS via Helmet).

## 6. What the app already does

- Express rate limits (global 300/15min, auth 20/15min) backed by **Upstash Redis**
- Helmet security headers, CSRF on mutations, mongo-sanitize, Zod validation
- Pages `_headers`: CSP, X-Frame-Options, nosniff
- Cloudflare Turnstile on login/signup (when keys set)

## 7. After custom domain

Update `CORS_ORIGIN`, `CLIENT_URL`, Google OAuth URIs, Turnstile allowed domains, and `client/src/config/site.ts`.
