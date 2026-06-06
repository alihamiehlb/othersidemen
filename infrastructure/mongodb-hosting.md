# Where to Host MongoDB for OTHER SIDE (AWS)

## Do you need Supabase?

**No.** Supabase is PostgreSQL-based. This project uses **MongoDB**. They are different databases — pick one stack and stick with it.

| Option | Best for | AWS integration |
|--------|----------|-----------------|
| **MongoDB Atlas** (recommended) | Production, managed, free tier | Deploy on AWS region, VPC peering with ECS |
| **Docker MongoDB** | Local dev / staging | `docker-compose up mongodb` |
| **Amazon DocumentDB** | AWS-native | MongoDB-compatible, not 100% feature parity |

## Recommended: MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Choose **AWS** as cloud provider, same region as your ECS/ALB (e.g. `us-east-1`)
3. Create database user + whitelist IPs (or `0.0.0.0/0` for dev only)
4. Copy connection string:
   ```
   mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/twoside-store
   ```
5. Set `MONGODB_URI` in server environment (ECS task def, `.env`, or AWS Secrets Manager)

## Redis on AWS

Use **Amazon ElastiCache (Redis)** in the same VPC as your API server.

```
REDIS_URL=redis://<elasticache-endpoint>:6379
```

Local dev: `docker-compose up redis` or `REDIS_URL=redis://localhost:6379`

## Full AWS Stack

```
CloudFront → S3 (React SPA)
     ↓
    ALB → ECS Fargate (Node.js API)
              ↓         ↓
         MongoDB Atlas  ElastiCache Redis
         (or DocumentDB)
```

## Environment Order (first deploy)

1. MongoDB Atlas cluster + connection string
2. ElastiCache Redis cluster
3. ECS/Fargate with env vars: `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `CSRF_SECRET`, `GOOGLE_CLIENT_ID/SECRET`
4. S3 + CloudFront for frontend
5. Run `npm run seed -w server` once to populate products + admin user
