# CI/CD — GitHub → AWS Auto Deploy

Push to `main` → GitHub Actions builds → deploys to AWS.

## Architecture

```
git push main
    ↓
GitHub Actions
    ├── Build & test
    ├── Push server image → ECR
    ├── Push client image → ECR (optional)
    ├── Deploy API → ECS Fargate (rolling update)
    └── Deploy frontend → S3 + CloudFront invalidation
```

## One-Time AWS IAM Setup

Create an IAM user `github-actions-deploy` with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::twoside-store-frontend",
        "arn:aws:s3:::twoside-store-frontend/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "*"
    }
  ]
}
```

## GitHub Secrets Required

Add at: **Repository → Settings → Secrets and variables → Actions**

| Secret | Example |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | `...` |
| `AWS_REGION` | `us-east-1` |
| `ECR_SERVER_REPO` | `twoside-server` |
| `ECS_CLUSTER` | `twoside-cluster` |
| `ECS_SERVICE` | `twoside-api` |
| `ECS_TASK_FAMILY` | `twoside-server` |
| `S3_BUCKET` | `twoside-store-frontend` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E1234ABCDEF` |
| `VITE_API_URL` | `https://api.yourdomain.com` |

## Workflows

| File | Trigger | What it does |
|------|---------|--------------|
| `.github/workflows/ci.yml` | PR + push | Lint, typecheck, build |
| `.github/workflows/deploy.yml` | push to `main` | Build + deploy to AWS |

## Manual first deploy

Before CI/CD works, deploy once manually:

```bash
# Build and push server
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t twoside-server ./server
docker tag twoside-server:latest <account>.dkr.ecr.us-east-1.amazonaws.com/twoside-server:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/twoside-server:latest

# Build and upload frontend
cd client && VITE_API_URL=https://api.yourdomain.com npm run build
aws s3 sync dist/ s3://twoside-store-frontend --delete
aws cloudfront create-invalidation --distribution-id E1234ABCDEF --paths "/*"
```

After that, every `git push origin main` redeploys automatically.

## Branch strategy

| Branch | Deploy |
|--------|--------|
| `main` | Production (auto deploy) |
| `develop` | CI only (no deploy) |
| feature/* | CI only |

## Rollback

```bash
# ECS: roll back to previous task definition revision
aws ecs update-service --cluster twoside-cluster --service twoside-api --task-definition twoside-server:PREVIOUS_REVISION

# Frontend: re-deploy previous commit
git checkout <previous-commit>
cd client && npm run build
aws s3 sync dist/ s3://twoside-store-frontend --delete
```
