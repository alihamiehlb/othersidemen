# OTHER SIDE — Men's Fashion E-Commerce

Two sides. One identity. Full-stack men's fashion store built with React, TypeScript, Node.js, MongoDB, and Redis — ready for AWS deployment.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router |
| Backend | Node.js, Express, TypeScript, Mongoose (MongoDB) |
| Cache | Redis (ioredis) — products, sessions, carts |
| Auth | Google OAuth + email/password, JWT httpOnly cookies |
| Security | Helmet, CSRF, rate limiting, mongo-sanitize, HPP, Zod validation |
| Deploy | Docker, Cloudflare Pages, Railway, Upstash Redis |

## Where to Host the Database?

**Use MongoDB Atlas** (recommended) — not Supabase (that's PostgreSQL).

See [infrastructure/mongodb-hosting.md](infrastructure/mongodb-hosting.md) for full AWS + MongoDB setup guide.

## Quick Start (Local)

### 1. Start databases

```bash
docker-compose up mongodb redis -d
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit JWT_SECRET, CSRF_SECRET, GOOGLE_CLIENT_ID/SECRET if using Google auth
```

### 3. Install & seed

```bash
npm install
npm run seed -w server
```

### 4. Run dev

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001/api/health

### Default admin login

- Email: `admin@otherside.com`
- Password: `Admin123!Change` (change in production)

## Features

### Store (Men Only)
- Hero with WebP images (`hero.webp`, `hero-mobile.webp`)
- Product catalog from MongoDB (`/shop`, `/product/:slug`)
- Shopping cart with Redis caching
- Outfit builder, lookbook, style DNA sections

### Auth
- Google OAuth (`/api/auth/google`)
- Email signup/login
- Protected account page

### Admin Panel (`/admin`)
- Dashboard statistics (users, orders, revenue)
- User management (activate/deactivate)
- Product management
- Order status management

### Security
- CSRF protection on mutations
- Rate limiting (global, auth, admin)
- NoSQL injection prevention (mongo-sanitize)
- HTTP parameter pollution protection (hpp)
- Helmet security headers
- Input validation (Zod)
- httpOnly JWT cookies

### SEO
- `public/robots.txt`
- `public/llms.txt`
- Open Graph meta tags

### UX
- Branded loading screen on navigation
- Branded error/not-found screens
- Responsive hero (mobile WebP variant)

## Project Structure

```
twoside-store/
├── client/                 # React SPA
│   ├── public/images/      # hero.webp, hero-mobile.webp
│   ├── public/robots.txt
│   ├── public/llms.txt
│   └── src/
│       ├── pages/          # Home, Shop, Cart, Login, Admin
│       ├── contexts/       # Auth, Cart
│       └── components/
├── server/                 # Express API
│   └── src/
│       ├── models/         # User, Product, Order
│       ├── routes/         # auth, products, cart, orders, admin
│       ├── middleware/     # auth, csrf, rateLimit
│       └── scripts/seed.ts
├── infrastructure/         # AWS + MongoDB guides
└── docker-compose.yml      # mongodb + redis + server + client
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `server/.env`

## Adding Images

Drop WebP files in `client/public/images/` and register in `client/src/config/images.ts`.

Hero is already optimized:
- Desktop: `hero.webp` (48KB)
- Mobile: `hero-mobile.webp` (28KB)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server |
| `npm run seed -w server` | Seed products + admin user |
| `npm run build` | Build both |
| `npm run deploy:pages` | Deploy frontend to Cloudflare Pages |
| `npm run deploy:api` | Deploy API to Cloudflare Workers Container |
| `docker-compose up -d` | Full stack in Docker |

## Pre-deployment (configure first, deploy later)

**Do not deploy yet.** Follow this order:

1. **Today** — Google OAuth + test all features locally → [PRE-DEPLOYMENT-PLAN.md](infrastructure/PRE-DEPLOYMENT-PLAN.md)
2. **Tomorrow** — Send image zip → categorize, WebP, wire to products
3. **Then** — Deploy to Cloudflare → [CLOUDFLARE-CICD.md](infrastructure/CLOUDFLARE-CICD.md)

## Cloudflare Deployment & CI/CD

See [infrastructure/CLOUDFLARE-CICD.md](infrastructure/CLOUDFLARE-CICD.md) for GitHub Actions, Pages CDN, and Workers Containers.

Overview: [infrastructure/cloudflare-deployment.md](infrastructure/cloudflare-deployment.md).

Legacy AWS: [infrastructure/aws-deployment.md](infrastructure/aws-deployment.md) (disabled workflow in `.github/workflows/deploy.yml`).
