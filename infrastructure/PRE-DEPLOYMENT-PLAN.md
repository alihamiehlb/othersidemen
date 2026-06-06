# Pre-Deployment Plan — OTHER SIDE Store

> **Status:** Configure & test locally first → images tomorrow → deploy to Cloudflare after sign-off.  
> **Do not deploy until Phase 3 checklist is complete.**

---

## Phase 1 — Today: Configure & test locally

### 1.1 Start the app

```powershell
cd c:\folders\projects-all-new\twoside-store
npm run dev:fresh
```

Open the URL Vite prints (usually http://localhost:5173).

### 1.2 Google OAuth (you do this in Google Cloud)

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create project → **OAuth consent screen** (External, add your email as test user)
3. **Create OAuth 2.0 Client ID** → Web application
4. **Authorized redirect URIs** — add exactly:
   ```
   http://localhost:3001/api/auth/google/callback
   ```
5. Copy Client ID and Client Secret into `server/.env`:

```env
GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
ADMIN_EMAIL=your-real@gmail.com
```

6. Restart: `npm run dev:fresh`
7. Test: `/login` → **Continue with Google** → should land on `/account`
8. If `ADMIN_EMAIL` matches your Gmail, you get **admin** → `/admin`

Full guide: [google-oauth.md](./google-oauth.md)

### 1.3 Email/password auth (already works)

| Test | Credentials |
|------|-------------|
| Admin login | `admin@otherside.com` / `Admin123!Change` |
| New user | Sign up on `/login` with any email |

### 1.4 Feature test checklist (run before tomorrow)

| # | Feature | URL | Pass? |
|---|---------|-----|-------|
| 1 | Home + hero image | `/` | ☐ |
| 2 | New In products | scroll home | ☐ |
| 3 | Shop + category filters | `/shop` | ☐ |
| 4 | Product page + add to bag | `/product/utility-puffer-jacket` | ☐ |
| 5 | Cart + checkout | `/cart` (sign in first) | ☐ |
| 6 | Email signup | `/login` | ☐ |
| 7 | Email login | `/login` | ☐ |
| 8 | Google login | `/login` | ☐ |
| 9 | Account page | `/account` | ☐ |
| 10 | Admin dashboard | `/admin` | ☐ |
| 11 | Admin users | `/admin/users` | ☐ |
| 12 | Admin products | `/admin/products` | ☐ |
| 13 | Admin orders | `/admin/orders` | ☐ |
| 14 | API health | http://localhost:3001/api/health | ☐ |

### 1.5 Already configured

| Service | Status |
|---------|--------|
| MongoDB Atlas | Connected, 6 products seeded |
| Upstash Redis | Connected (`REDIS_URL` in server/.env) |
| JWT + CSRF secrets | Set in server/.env |
| Cloudflare deploy files | Ready (not deployed yet) |

---

## Phase 2 — Tomorrow: Your image zip

When you send the image zip, I will:

1. **Extract & categorize** — map files to products (outerwear, tops, bottoms, footwear, accessories) and hero/lookbook
2. **Convert to WebP** — optimize for web (photos use WebP, not WebM — WebM is for video)
3. **Upload** — Cloudflare R2 bucket `twoside-store-assets` (or local `client/public/images/` for dev first)
4. **Update MongoDB** — set `products.images[]` URLs in Atlas for each product slug
5. **Update** `client/src/config/images.ts` — hero, lookbook, style DNA sections
6. **Re-seed or patch** products if new items are in the zip
7. **Verify** all pages show real photos locally

### What to include in the zip

- Product photos (name or folder = product slug if possible, e.g. `utility-puffer-jacket.jpg`)
- Hero / banner images (optional)
- Lookbook / lifestyle shots (optional)

### Image → product mapping (current slugs)

| Slug | Product |
|------|---------|
| `utility-puffer-jacket` | Utility Puffer Jacket |
| `oversized-hoodie` | Oversized Hoodie |
| `cargo-pants` | Cargo Pants |
| `high-top-sneakers` | High Top Sneakers |
| `bomber-jacket` | Bomber Jacket |
| `crossbody-bag` | Crossbody Bag |

---

## Phase 3 — Deploy to Cloudflare (after Phase 1 + 2 done)

Only when local testing passes and images are in place.

### 3.1 GitHub secrets

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID |
| `VITE_API_URL` | `https://api.yourdomain.com` |

### 3.2 Worker secrets (production)

```powershell
cd cloudflare\api
npx wrangler secret put MONGODB_URI
npx wrangler secret put REDIS_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put CSRF_SECRET
npx wrangler secret put CORS_ORIGIN
npx wrangler secret put CLIENT_URL
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_CALLBACK_URL
```

Production Google redirect URI (add in Google Console):
```
https://api.yourdomain.com/api/auth/google/callback
```

### 3.3 Deploy

```powershell
git push origin main
```

Or manually: `npm run deploy:pages` + `npm run deploy:api`

Full guide: [CLOUDFLARE-CICD.md](./CLOUDFLARE-CICD.md)

### 3.4 Post-deploy checklist

- [ ] `yourdomain.com` loads store (CDN)
- [ ] `api.yourdomain.com/api/health` returns ok
- [ ] Login (email + Google) works on production URL
- [ ] Cart + checkout works
- [ ] Admin panel works
- [ ] Images load from R2/CDN
- [ ] Cloudflare WAF + rate limits enabled

---

## Quick reference

| Doc | Purpose |
|-----|---------|
| [google-oauth.md](./google-oauth.md) | Google login setup |
| [CLOUDFLARE-CICD.md](./CLOUDFLARE-CICD.md) | Deploy + CDN + CI/CD |
| [SETUP-GUIDE.md](./SETUP-GUIDE.md) | Full local setup |
| `.env.production.example` | Production env template |

---

## Order of operations (summary)

```
TODAY     → Google OAuth + test all features locally
TOMORROW  → Send image zip → categorize, WebP, wire to site
THEN      → Deploy to Cloudflare (Pages CDN + API container)
```
