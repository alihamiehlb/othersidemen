# Cloudflare CI/CD Setup — OTHER SIDE Store

Deploy **frontend to Cloudflare Pages (global CDN)** and **API to Cloudflare Workers Containers** via GitHub Actions.

## Architecture

```
                    Cloudflare Edge (CDN + DDoS + WAF)
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
   Pages (yourdomain.com)    Workers Container          R2 (images)
   React SPA + _headers       Express API on Docker      optional
   300+ CDN locations        api.yourdomain.com
          │                         │
          └───────── VITE_API_URL ──┘
                                    │
                    MongoDB Atlas + Upstash Redis
```

---

## One-time Cloudflare setup

### 1. Create Cloudflare account

[https://dash.cloudflare.com](https://dash.cloudflare.com)

### 2. Create Pages project (first deploy)

Either connect GitHub in the dashboard **or** let GitHub Actions create it on first deploy.

Project name: **`twoside-store`**

### 3. Create API token for GitHub

Dashboard → **My Profile → API Tokens → Create Token**

Use template **Edit Cloudflare Workers** and add permissions:
- Account → Cloudflare Pages → Edit
- Account → Workers Scripts → Edit
- Account → Workers Containers → Edit

Save the token as GitHub secret `CLOUDFLARE_API_TOKEN`.

Account ID: Dashboard → right sidebar → **Account ID** → GitHub secret `CLOUDFLARE_ACCOUNT_ID`.

### 4. Set API Worker secrets (required before API works)

From repo root, after installing deps:

```powershell
cd cloudflare\api
npm install
npx wrangler login

npx wrangler secret put MONGODB_URI
npx wrangler secret put REDIS_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put CSRF_SECRET
npx wrangler secret put CORS_ORIGIN
npx wrangler secret put CLIENT_URL
npx wrangler secret put ADMIN_EMAIL
# Optional OAuth:
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_CALLBACK_URL
```

Production values example:

| Secret | Example |
|--------|---------|
| `CORS_ORIGIN` | `https://yourdomain.com` |
| `CLIENT_URL` | `https://yourdomain.com` |
| `GOOGLE_CALLBACK_URL` | `https://api.yourdomain.com/api/auth/google/callback` |
| `REDIS_URL` | `rediss://default:TOKEN@xxx.upstash.io:6379` |

> First container deploy takes 2–3 minutes to provision.

---

## GitHub secrets

Repository → **Settings → Secrets and variables → Actions**

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Token from step 3 |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID |
| `VITE_API_URL` | `https://api.yourdomain.com` or `https://twoside-store-api.<subdomain>.workers.dev` |

---

## CI/CD workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `.github/workflows/ci.yml` | PR + push to main/develop | Builds client + server |
| `.github/workflows/deploy-cloudflare.yml` | Push to `main` | Deploys Pages + API container |

Push to `main` → automatic production deploy.

Manual deploy:

```powershell
npm run deploy:pages   # frontend only
npm run deploy:api     # API container only
```

---

## DNS + CDN (custom domain)

In Cloudflare DNS for your domain:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `twoside-store.pages.dev` | Proxied (orange) |
| CNAME | `www` | `twoside-store.pages.dev` | Proxied |
| CNAME | `api` | `twoside-store-api.<account>.workers.dev` | Proxied |

Pages → **Custom domains** → add `yourdomain.com`.

---

## CDN caching (already configured)

**Frontend** — `client/public/_headers`:
- JS/CSS: 1 year cache (immutable)
- Images: 7 days + stale-while-revalidate

**API** — product routes send:
- `Cache-Control: public, s-maxage=300` (Cloudflare edge caches public product JSON)

**Do not CDN-cache** auth, cart, orders, admin — those routes have no cache headers.

---

## DDoS + WAF (recommended)

Dashboard → your domain:

1. **SSL/TLS** → Full (strict), Always Use HTTPS ON
2. **Security → Bots** → Bot Fight Mode ON
3. **Security → WAF → Rate limiting** → `/api/*` max 100 req/min per IP
4. **Security → Settings** → Security Level: Medium

---

## R2 for product images (next step)

1. Dashboard → **R2** → Create bucket `twoside-store-assets`
2. Enable public access or custom domain `assets.yourdomain.com`
3. Add secrets: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
4. Tomorrow's image zip → upload to R2, store URLs in MongoDB

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Pages deploy fails | Check `CLOUDFLARE_API_TOKEN` has Pages Edit permission |
| API 502 after deploy | Wait 2–3 min for container provisioning; check `wrangler tail` |
| Login broken in prod | `VITE_API_URL` must match API domain; cookies need same-site lax |
| Container can't reach MongoDB | Atlas Network Access → allow `0.0.0.0/0` or Cloudflare egress IPs |

```powershell
cd cloudflare\api
npx wrangler tail twoside-store-api
```

---

## Local dev (unchanged)

```powershell
npm run dev:fresh
```

Local uses Vite proxy — do **not** set `VITE_API_URL` in dev.
