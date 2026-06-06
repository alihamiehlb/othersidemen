# AWS Deployment Guide — OTHER SIDE Store

## Architecture Overview

```
                    ┌─────────────────┐
                    │   CloudFront    │  CDN for static assets + SPA
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
     │  S3 Bucket    │ │   ALB    │ │ ElastiCache │
     │  (frontend)   │ │          │ │   (Redis)   │
     └───────────────┘ └────┬─────┘ └──────┬──────┘
                            │              │
                     ┌──────▼─────┐        │
                     │  ECS/Fargate│◄───────┘
                     │  (API)     │
                     └────────────┘
```

## Recommended AWS Services

| Component | Service | Purpose |
|-----------|---------|---------|
| Frontend hosting | S3 + CloudFront | Static SPA deployment |
| API server | ECS Fargate or Elastic Beanstalk | Node.js backend |
| Redis cache | ElastiCache (Redis) | Session & data caching |
| Images/assets | S3 + CloudFront | Product & lookbook images |
| DNS | Route 53 | Domain management |
| Secrets | AWS Secrets Manager | API keys, DB credentials |
| CI/CD | CodePipeline or GitHub Actions | Automated deployments |

## Quick Deploy Options

### Option A: Docker on ECS Fargate (full stack)

1. Push images to ECR:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
   docker build -t twoside-client ./client
   docker build -t twoside-server ./server
   docker tag twoside-client <account>.dkr.ecr.<region>.amazonaws.com/twoside-client:latest
   docker tag twoside-server <account>.dkr.ecr.<region>.amazonaws.com/twoside-server:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/twoside-client:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/twoside-server:latest
   ```

2. Create ECS task definitions referencing the ECR images
3. Set environment variables: `REDIS_URL`, `CORS_ORIGIN`, `PORT`
4. Create ElastiCache Redis cluster and point `REDIS_URL` to it

### Option B: S3 + CloudFront (frontend only, current phase)

1. Build the client:
   ```bash
   npm run build:client
   ```

2. Upload to S3:
   ```bash
   aws s3 sync client/dist/ s3://twoside-store-assets --delete
   ```

3. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
   ```

### Option C: Local Docker (development/staging)

```bash
docker-compose up -d
```

Access at `http://localhost` (client) and `http://localhost:3001/api/health` (server).

## Environment Variables (Production)

| Variable | Example | Required |
|----------|---------|----------|
| `PORT` | `3001` | Yes (server) |
| `NODE_ENV` | `production` | Yes |
| `REDIS_URL` | `redis://<elasticache-endpoint>:6379` | Yes (when caching enabled) |
| `CORS_ORIGIN` | `https://otherside.com` | Yes |
| `AWS_S3_BUCKET` | `twoside-store-assets` | When using S3 for images |
| `AWS_REGION` | `us-east-1` | Yes |

## Redis (ElastiCache) Setup

1. Create an ElastiCache Redis cluster (cache.t3.micro for dev)
2. Place it in the same VPC as your ECS tasks
3. Set `REDIS_URL=redis://<cluster-endpoint>:6379` in ECS task env
4. The server auto-connects on startup (see `server/src/config/redis.ts`)

## Image Assets on S3

When you have real images:

1. Upload to `s3://twoside-store-assets/images/`
2. Update `client/src/config/images.ts` with CloudFront URLs:
   ```typescript
   hero: {
     model: 'https://d1234.cloudfront.net/images/hero-model.jpg',
   }
   ```
3. Or keep images in `client/public/images/` and rebuild — they'll be bundled into the SPA
