# Step-by-Step Setup Guide — OTHER SIDE Store

Follow these steps **in order**. Do not skip ahead.

---

## Phase 1: Accounts & Tools (30 min)

### 1.1 Install locally
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com)
- [AWS CLI](https://aws.amazon.com/cli/) (`aws configure` with your keys)
- [GitHub CLI](https://cli.github.com) (optional)

### 1.2 Create accounts
| Service | URL | What for |
|---------|-----|----------|
| **GitHub** | github.com | Code + CI/CD |
| **MongoDB Atlas** | mongodb.com/atlas | Database (NOT Supabase) |
| **AWS** | aws.amazon.com | Hosting |
| **Google Cloud** | console.cloud.google.com | OAuth login |

---

## Phase 2: MongoDB Atlas (Database) — 20 min

> MongoDB has no native RLS like PostgreSQL. Access control is enforced in the API via `server/src/policies/accessPolicies.ts`.

### 2.1 Create cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create** → Shared (free) or Dedicated (production)
3. Cloud provider: **AWS**, Region: same as your API (e.g. `us-east-1`)
4. Cluster name: `twoside-store`

### 2.2 Create database user
1. Database Access → Add New Database User
2. Username: `twoside_api`
3. Password: generate strong password → **save it**
4. Role: `readWrite` on `twoside-store` database

### 2.3 Network access
1. Network Access → Add IP Address
2. Dev: your IP or `0.0.0.0/0` (temporary only)
3. Production: VPC peering or ECS NAT gateway IP

### 2.4 Get connection string
1. Database → Connect → Drivers
2. Copy:
   ```
   mongodb+srv://twoside_api:<password>@cluster0.xxxxx.mongodb.net/twoside-store
   ```
3. Save as `MONGODB_URI` in `server/.env`

### 2.5 Seed data
```bash
cd twoside-store
npm install
npm run seed -w server
```

---

## Phase 3: Redis — 15 min

### Option A: Local dev (Docker)
```bash
docker-compose up redis -d
```
Set in `server/.env`:
```
REDIS_URL=redis://localhost:6379
```

### Option B: AWS ElastiCache (production)
1. AWS Console → ElastiCache → Create Redis cluster
2. Node type: `cache.t3.micro` (dev) or `cache.r6g.large` (prod)
3. Same VPC as ECS tasks
4. Copy primary endpoint:
   ```
   REDIS_URL=redis://twoside-cache.xxxxx.cache.amazonaws.com:6379
   ```
5. Store in AWS Secrets Manager (see Phase 5)

---

## Phase 4: Google OAuth — 10 min

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create project → APIs & Services → Credentials
3. **OAuth 2.0 Client ID** → Web application
4. Authorized redirect URIs:
   - Dev: `http://localhost:3001/api/auth/google/callback`
   - Prod: `https://api.yourdomain.com/api/auth/google/callback`
5. Add to `server/.env`:
   ```
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   ```

---

## Phase 5: Generate secrets — 5 min

**Windows (no openssl):**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Run twice for `JWT_SECRET` and `CSRF_SECRET`.

**Mac/Linux:**
```bash
openssl rand -base64 32
```

Add to `server/.env`:
```
JWT_SECRET=<output-1>
CSRF_SECRET=<output-2>
ADMIN_EMAIL=your-email@gmail.com
```

---

## Phase 6: Run locally — 5 min

```bash
# Start MongoDB + Redis locally (if not using Atlas for dev)
docker-compose up mongodb redis -d

# Or use Atlas URI in server/.env and only start Redis:
docker-compose up redis -d

# Run everything
npm run dev
```

| URL | Service |
|-----|---------|
| http://localhost:5173 | Frontend |
| http://localhost:3001/api/health | API health |
| http://localhost:5173/admin | Admin panel |

Login: `admin@otherside.com` / `Admin123!Change` (after seed)

---

## Phase 7: Production hosting — Cloudflare (recommended)

See [cloudflare-deployment.md](./cloudflare-deployment.md) for the full guide:
- **Cloudflare Pages** — frontend
- **Railway/Render** — API
- **Upstash Redis** — cache
- **Cloudflare R2** — images (optional)
- **Cloudflare WAF** — DDoS + rate limits at the edge

Legacy AWS guide: [aws-deployment.md](./aws-deployment.md)

---

## Phase 8: GitHub CI/CD — 30 min

See [CICD.md](./CICD.md) for full details.

### 8.1 Push code to GitHub
```bash
git init
git add .
git commit -m "feat: initial OTHER SIDE store"
git remote add origin https://github.com/YOUR_USER/twoside-store.git
git push -u origin main
```

### 8.2 Add GitHub Secrets
Repository → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |
| `AWS_REGION` | `us-east-1` |
| `ECR_SERVER_REPO` | `twoside-server` |
| `ECR_CLIENT_REPO` | `twoside-client` |
| `ECS_CLUSTER` | Your ECS cluster name |
| `ECS_SERVICE` | Your ECS service name |
| `S3_BUCKET` | `twoside-store-frontend` |
| `CLOUDFRONT_DISTRIBUTION_ID` | Your distribution ID |

### 8.3 Deploy
Every push to `main` triggers automatic deploy via `.github/workflows/deploy.yml`.

---

## Checklist Before Going Live

- [ ] `MONGODB_URI` points to Atlas (not localhost)
- [ ] `REDIS_URL` points to ElastiCache
- [ ] `JWT_SECRET` and `CSRF_SECRET` are unique random 32+ char strings
- [ ] Google OAuth redirect URI matches production API URL
- [ ] Atlas network access restricted to ECS/VPC IPs (not 0.0.0.0/0)
- [ ] `ADMIN_EMAIL` set to your real email
- [ ] Default admin password changed
- [ ] GitHub Actions deploy workflow tested
- [ ] HTTPS enabled on CloudFront + ALB

---

## Access Control (RLS equivalent)

Policies live in `server/src/policies/accessPolicies.ts`.

Every query is scoped:
- Users see **only their own** orders
- Carts are keyed to `user:{userId}` when logged in (prevents IDOR)
- Products public read = active men's only
- Admin routes require `role: admin` middleware

Full policy table: [ACCESS-POLICIES.md](./ACCESS-POLICIES.md)
