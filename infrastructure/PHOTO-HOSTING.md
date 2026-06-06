# Where product photos are hosted

## Current setup (production)

| Layer | Where | Account |
|-------|--------|---------|
| **Image files** | **Cloudflare Pages CDN** | `alihamiehlb@gmail.com` → project **`twoside-store`** |
| **Public URLs** | `https://twoside-store.pages.dev/images/catalog/...` | Same Cloudflare account |
| **Database** | **MongoDB Atlas** | Stores path strings only (e.g. `/images/catalog/looks/os-2023-12-15-01.webp`) — not binary |
| **Cache** | **Upstash Redis** | Session/cart/product cache (optional) |

Photos are **not** on Instagram, R2, or S3 today. They were processed to WebP and uploaded as static files with the Pages deploy (~791 files under `/images/catalog/`).

## Why homepage looked empty

1. **API** — Cloudflare **Containers require Workers Paid** ($5/mo). The free worker URL times out, so product lists never loaded.
2. **Style DNA cards** — When the API fails, the UI showed text-only fallback cards (black boxes). Fixed with `catalog-preview.json` fallback + CDN image paths.

## API hosting (fix)

| Service | Role | Plan |
|---------|------|------|
| Cloudflare Pages | Storefront + **all product images** | Free |
| **Render** (recommended) | Express API (`render.yaml`) | Free tier |
| Cloudflare Worker + Container | Only if you **upgrade Workers Paid** | Paid |

## Optional future: Cloudflare R2

Move images to R2 + custom domain `assets.yourdomain.com` when the catalog grows or you need admin uploads. See `infrastructure/CLOUDFLARE-CICD.md`.

## Restore images locally

If `client/public/images/catalog/` is empty on disk but still on CDN:

```powershell
# Re-process from source zip (if you still have otherside.men.zip)
npm run process-images
npm run build:client
npm run deploy:pages
```
