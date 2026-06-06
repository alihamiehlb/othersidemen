# GitHub → Cloudflare deploy guide (OTHER SIDE)

Step-by-step: create a GitHub repo, push safely, deploy frontend + API, and go live.

---

## Where you are now

| Area | Status |
|------|--------|
| Store UI (shop, cart, modal, theme) | Done locally |
| 791 products + images in `client/public/images/catalog/` | Done |
| MongoDB Atlas + Upstash Redis | Configured in `server/.env` (local only) |
| Admin panel `/admin` | Done |
| Legal pages (privacy, terms, cookies, security) | Done |
| `robots.txt`, `llms.txt`, `security.txt`, `sitemap.xml` | Done |
| GitHub Actions (`.github/workflows/deploy-cloudflare.yml`) | Ready — needs secrets |
| Production deploy | **Not done yet** |
| Custom domain + SSL | **Not done yet** |
| Rotate secrets before public launch | **Required** |

---

## Step 0 — Security before GitHub

**Never commit secrets.** These stay local or in Cloudflare/GitHub Secrets only:

- `server/.env` (MongoDB password, Redis token, JWT, Google OAuth)
- Any `.env` with real passwords

`.gitignore` already excludes them. Verify:

```powershell
cd c:\folders\projects-all-new\twoside-store
git status
```

If `server/.env` appears, do **not** commit it.

**Before launch, rotate:**

1. MongoDB Atlas → Database Access → new password
2. Upstash → rotate Redis token
3. Google Cloud → new OAuth client secret (revoke old one)
4. Generate new `JWT_SECRET` and `CSRF_SECRET`:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

Update `server/.env` locally after rotation.

---

## Step 1 — Create GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `twoside-store` (or your choice)
3. **Private** recommended (catalog + config)
4. Do **not** add README/license (you already have a project)

On your PC:

```powershell
cd c:\folders\projects-all-new\twoside-store

git init
git add .
git status
```

Confirm **no** `server/.env` in the list. Then:

```powershell
git commit -m "feat: initial OTHER SIDE store — shop, admin, legal, Cloudflare CI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/twoside-store.git
git push -u origin main
```

> Catalog images (~791 WebP) are included via `.gitignore` rules. First push may take several minutes.

---

## Step 2 — Cloudflare account

1. Sign up: [dash.cloudflare.com](https://dash.cloudflare.com)
2. Note **Account ID** (right sidebar on any domain overview)

### API token for GitHub

Dashboard → **My Profile → API Tokens → Create Token**

Permissions:

- Account → Cloudflare Pages → **Edit**
- Account → Workers Scripts → **Edit**
- Account → Workers Containers → **Edit**

Save the token — you will not see it again.

---

## Step 3 — GitHub repository secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | Token from Step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `VITE_API_URL` | `https://api.YOURDOMAIN.com` (or Workers URL until custom domain) |

---

## Step 4 — API secrets (Wrangler)

The API runs as a **Cloudflare Worker + Container** (`cloudflare/api/`).

```powershell
cd c:\folders\projects-all-new\twoside-store\cloudflare\api
npm install
npx wrangler login
```

Set secrets (paste production values — **not** from committed files):

```powershell
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

Production examples:

| Secret | Example |
|--------|---------|
| `CORS_ORIGIN` | `https://otherside.com` |
| `CLIENT_URL` | `https://otherside.com` |
| `GOOGLE_CALLBACK_URL` | `https://api.otherside.com/api/auth/google/callback` |
| `REDIS_URL` | `rediss://default:TOKEN@xxx.upstash.io:6379` |

First container deploy can take 2–3 minutes.

---

## Step 5 — Deploy

### Option A — GitHub Actions (recommended)

Push to `main` or run manually:

**Actions → Deploy to Cloudflare → Run workflow**

This runs:

1. Build client + server
2. Deploy `client/dist` → **Cloudflare Pages** (`twoside-store`)
3. Deploy API → **Workers Container**

### Option B — Manual (first test)

```powershell
cd c:\folders\projects-all-new\twoside-store
npm run build:client
npx wrangler pages deploy client/dist --project-name=twoside-store

cd cloudflare\api
npx wrangler deploy
```

---

## Step 6 — Custom domain

### Frontend (Pages)

Cloudflare → **Workers & Pages → twoside-store → Custom domains**

Add: `otherside.com` and `www.otherside.com`

### API

Workers → your API worker → **Triggers → Custom Domains**

Add: `api.otherside.com`

Update GitHub secret `VITE_API_URL=https://api.otherside.com` and redeploy Pages.

### Google OAuth

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth client:

- **Authorized JavaScript origins:** `https://otherside.com`
- **Redirect URI:** `https://api.otherside.com/api/auth/google/callback`

---

## Step 7 — Update public files for your domain

Replace `otherside.com` in:

- `client/public/robots.txt` (Sitemap line)
- `client/public/sitemap.xml`
- `client/public/.well-known/security.txt`
- `client/public/security.txt`
- `client/public/llms.txt`
- `client/index.html` (canonical meta if present)

Update contact emails in `client/src/pages/legal/policies.ts`.

Commit and push → auto redeploy.

---

## Step 8 — Verify production

| Check | URL |
|-------|-----|
| Home | `https://yourdomain.com` |
| Shop + modal | `/shop` |
| Legal | `/privacy`, `/security-policy` |
| robots | `/robots.txt` |
| security.txt | `/.well-known/security.txt` |
| llms.txt | `/llms.txt` |
| API health | `https://api.yourdomain.com/api/health` |
| Admin | `/admin` (login as admin) |

---

## What images go to GitHub / Cloudflare?

| Layer | What |
|-------|------|
| **Files** | `client/public/images/catalog/**/*.webp` (~791 files) |
| **GitHub** | Same files in your repo (large push) |
| **Cloudflare Pages** | Built into `client/dist/images/` — served from global CDN |
| **MongoDB** | Only text paths like `/images/catalog/looks/foo.webp` |
| **Not** | Instagram, separate image host, or one-page-per-image |

Each product is **one DB row + one image file**, not a separate website.

---

## Remaining before “fully live”

- [ ] GitHub repo created and pushed (no secrets)
- [ ] Cloudflare secrets + GitHub secrets set
- [ ] Domain DNS on Cloudflare
- [ ] Google OAuth production URIs
- [ ] `VITE_WHATSAPP_NUMBER` in Pages env
- [ ] Rotate all secrets from dev
- [ ] Change default admin password
- [ ] Update `security.txt` / contact emails to real addresses
- [ ] Whish Pay merchant keys (optional)
- [ ] reCAPTCHA keys (optional, recommended)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Shop loads, API fails | Check `VITE_API_URL`, CORS_ORIGIN, API worker logs |
| Google login fails | Callback URL must match exactly in Google Console |
| Images 404 on Pages | Ensure `client/public/images/catalog` was committed and built |
| Deploy fails on images size | Git LFS or deploy catalog via R2 later (see `infrastructure/cloudflare-deployment.md`) |

More detail: `infrastructure/CLOUDFLARE-CICD.md` and `infrastructure/PRODUCTION-CHECKLIST.md`.
