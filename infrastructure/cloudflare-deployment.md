# Cloudflare Deployment Guide — OTHER SIDE Store

This guide replaces the AWS path with Cloudflare + MongoDB Atlas + Upstash Redis. Cloudflare provides **free DDoS protection** on all proxied domains (orange cloud).

## Architecture

| Component | Service | Purpose |
|-----------|---------|---------|
| Frontend | **Cloudflare Pages** | React SPA, global CDN |
| API | **Railway / Render / Fly.io** | Express server (Node.js) |
| Database | **MongoDB Atlas** | Primary data store |
| Cache | **Upstash Redis** | Cart/product cache |
| Images | **Cloudflare R2** | Product/hero assets (S3-compatible) |
| DNS + DDoS | **Cloudflare** | WAF, rate limits, SSL, bot fight |

> Cloudflare Workers can host APIs, but this Express app fits better on a Node container host. Cloudflare still protects the API via DNS proxy or Cloudflare Tunnel.

---

## Phase 1: Security secrets (Windows-friendly)

No `openssl` required. Run **twice** in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Put outputs in production env as `JWT_SECRET` and `CSRF_SECRET` (each 32+ chars).

Also set:
```
ADMIN_EMAIL=your-real-email@gmail.com
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
```

---

## Phase 2: MongoDB Atlas (keep as-is)

1. [MongoDB Atlas](https://www.mongodb.com/atlas) → your cluster
2. Connection string must include database name:
   ```
   mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/twoside-store
   ```
3. **Network Access** → allow `0.0.0.0/0` only for dev; in production restrict to your API host's outbound IP
4. Seed once:
   ```bash
   npm run seed -w server
   ```

---

## Phase 3: Redis with Upstash (replaces AWS ElastiCache)

1. [Upstash](https://upstash.com) → Create Redis database (free tier OK for dev)
2. Copy the **Redis URL** (starts with `rediss://` for TLS)
3. Set `REDIS_URL` in your API host environment

Local without Docker: leave `REDIS_URL` unset — the app runs without cache.

---

## Phase 4: Cloudflare account + domain

1. Sign up at [cloudflare.com](https://dash.cloudflare.com)
2. Add your domain → update nameservers at your registrar
3. Enable **Proxied** (orange cloud) on DNS records — this turns on DDoS mitigation automatically

### DDoS & abuse protection (recommended settings)

In Cloudflare Dashboard → your domain:

| Setting | Location | Recommendation |
|---------|----------|----------------|
| **Security Level** | Security → Settings | Medium or High |
| **Bot Fight Mode** | Security → Bots | On (free) |
| **Rate limiting** | Security → WAF → Rate limiting rules | e.g. 100 req/min per IP on `/api/*` |
| **Managed rules** | Security → WAF | Enable OWASP core ruleset (Pro plan) or free managed rules |
| **SSL/TLS** | SSL/TLS | Full (strict) |
| **Always Use HTTPS** | SSL/TLS → Edge Certificates | On |

The Express app already has:
- Helmet security headers
- CSRF on mutations
- express-rate-limit (300/15min global, 20/15min auth)
- mongo-sanitize, HPP, Zod validation

Cloudflare adds **edge** protection before traffic hits your server.

---

## Phase 5: Frontend — Cloudflare Pages

1. Push repo to GitHub
2. Cloudflare Dashboard → **Workers & Pages** → Create → **Pages** → Connect GitHub
3. Build settings:

| Setting | Value |
|---------|-------|
| Root directory | `client` |
| Build command | `npm run build` |
| Build output | `dist` |
| Node version | 20 |

4. Environment variables (Pages → Settings → Environment variables):

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.yourdomain.com` |

5. Custom domain: `yourdomain.com` → Pages project

---

## Phase 6: API — Railway (simplest Node host)

1. [Railway](https://railway.app) → New Project → Deploy from GitHub
2. Root directory: `server`
3. Start command: `npm run build && npm start`
4. Add environment variables:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...   # Upstash
JWT_SECRET=...
CSRF_SECRET=...
CORS_ORIGIN=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
ADMIN_EMAIL=you@gmail.com
```

5. Railway gives you a URL like `https://twoside-store-production.up.railway.app`

---

## Phase 7: DNS routing

In Cloudflare DNS:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `<pages-project>.pages.dev` | Proxied |
| CNAME | `www` | `<pages-project>.pages.dev` | Proxied |
| CNAME | `api` | `<railway-app>.up.railway.app` | Proxied |

Update Google OAuth redirect URI to `https://api.yourdomain.com/api/auth/google/callback`.

---

## Phase 8: Cloudflare R2 (optional — product images)

Replaces AWS S3 + CloudFront.

1. Cloudflare Dashboard → **R2** → Create bucket `twoside-store-assets`
2. R2 → Manage R2 API Tokens → Create token (Object Read & Write)
3. Enable public access via custom domain or R2.dev subdomain
4. Env vars (when S3 upload code is added):

```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=twoside-store-assets
R2_PUBLIC_URL=https://assets.yourdomain.com
```

R2 is S3-compatible — use `@aws-sdk/client-s3` with endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

---

## Phase 9: CI/CD (GitHub Actions)

Replace AWS deploy workflow with:

- **Pages**: auto-deploy on push to `main` (built into Cloudflare)
- **API**: Railway auto-deploy on push, or GitHub Action with Railway token

See `.github/workflows/ci.yml` for tests on every PR.

---

## Pre-launch checklist

- [ ] MongoDB Atlas IP allowlist restricted (not open to world in prod)
- [ ] `JWT_SECRET` and `CSRF_SECRET` are unique random strings (not dev defaults)
- [ ] `ADMIN_EMAIL` is your real email; change default admin password after seed
- [ ] Google OAuth redirect matches production API URL
- [ ] Cloudflare proxy enabled (orange cloud) on all public records
- [ ] Rate limiting rule on `/api/*` in Cloudflare WAF
- [ ] `CORS_ORIGIN` and `CLIENT_URL` set to production domain only
- [ ] Rotate any credentials that were ever committed or shared in chat

---

## Local development (no Docker)

```powershell
# 1. Install dependencies
npm install

# 2. Configure server/.env (MongoDB Atlas URI + secrets)

# 3. Seed database
npm run seed -w server

# 4. Run frontend + API
npm run dev
```

- Frontend: http://localhost:5173 (or 5174 if 5173 is busy)
- API health: http://localhost:3001/api/health
- Admin: http://localhost:5173/admin — `admin@otherside.com` / `Admin123!Change`

Redis is optional locally. MongoDB Atlas replaces local MongoDB.
