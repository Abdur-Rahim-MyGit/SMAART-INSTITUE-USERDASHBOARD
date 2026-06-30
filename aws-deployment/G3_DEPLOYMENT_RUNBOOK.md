# G3 — Sample (Staging) Deployment Runbook

**Goal:** deploy the SAME artifact we tested locally to a small, cheap, real AWS
environment, then run the SAME tests (k6, Playwright, ZAP) against it to get
**true** capacity numbers — then tear it down.

> **You run these steps in your own AWS account.** Claude cannot log in or deploy
> for you. Use a scoped **IAM user with MFA**, never the root email/password.
> Everything here is the production-shaped local stack mapped to AWS managed
> services (Nginx→ALB/CloudFront/WAF, replicas→Fargate, Mongo→Atlas).

---

## 0. Gates — do these FIRST (non-negotiable)

- [ ] **🔴 Rotate the leaked secrets (B1)** — new MongoDB/JWT/Cloudinary/SMTP/
      OpenRouter/etc. keys, and purge the old ones from git history. G3 is on the
      public internet; do not deploy the leaked creds.
- [ ] **AWS access**: create an IAM user (or SSO) with the policy in §1, enable
      **MFA**, and `aws configure` locally with its access keys. Do NOT use root.
- [ ] **Cost awareness**: G3 is **not free tier**. Rough lean cost while running:
      Fargate (~$15–25/mo), ALB (~$16/mo), NAT (~$32/mo), Atlas M10 (~$60/mo),
      CloudWatch/misc. **Tear it down after measuring (§9)** to stop charges.

---

## 1. IAM policy for the deploy identity (least-privilege)

Attach to the IAM user/role used to provision + deploy. Tighten resource ARNs
once names are known.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "ECR",    "Effect": "Allow", "Action": ["ecr:*"], "Resource": "*" },
    { "Sid": "ECS",    "Effect": "Allow", "Action": ["ecs:*"], "Resource": "*" },
    { "Sid": "ELB",    "Effect": "Allow", "Action": ["elasticloadbalancing:*"], "Resource": "*" },
    { "Sid": "Logs",   "Effect": "Allow", "Action": ["logs:*"], "Resource": "*" },
    { "Sid": "Secrets","Effect": "Allow", "Action": ["secretsmanager:GetSecretValue","secretsmanager:CreateSecret","secretsmanager:PutSecretValue"], "Resource": "*" },
    { "Sid": "S3CF",   "Effect": "Allow", "Action": ["s3:*","cloudfront:*"], "Resource": "*" },
    { "Sid": "IAMpass","Effect": "Allow", "Action": ["iam:PassRole"], "Resource": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/smaart-*" }
  ]
}
```

---

## 2. Environment variables

```
export REGION=ap-south-1
export ACCOUNT_ID=<your 12-digit account id>
export REPO=smaart-backend
export IMAGE_TAG=$(git rev-parse --short HEAD)     # immutable, never :latest
```

## 3. Build & push the backend image to ECR

```bash
aws ecr create-repository --repository-name $REPO --region $REGION || true
aws ecr get-login-password --region $REGION | docker login --username AWS \
  --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

docker build -f aws-deployment/Dockerfile -t $REPO:$IMAGE_TAG ./back-end
docker tag $REPO:$IMAGE_TAG $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO:$IMAGE_TAG
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO:$IMAGE_TAG
```

## 4. Database — MongoDB Atlas

- Create an Atlas project + an **M10** cluster in `ap-south-1` (M0 free works for
  a smoke, but won't give real capacity numbers).
- Create a DB user; allow access from the Fargate egress IP / VPC peering.
- The connection string goes into Secrets Manager (next step), NOT into code.

## 5. Secrets Manager

Put the **rotated** values in one secret (`staging/smaart/secrets`). The keys
must match the `secrets` block in `aws-deployment/ecs-task-definition.json`:
`MONGODB_URI, JWT_SECRET, OPENROUTER_API_KEY, SMTP_USER, SMTP_PASS,
CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, DEEPGRAM_API_KEY, OCR_SPACE_API_KEY,
ADMIN_SYSTEM_SECRET, USERDASHBOARD_SYNC_TOKEN, ITSM_API_KEY, REDIS_PASSWORD`.

```bash
aws secretsmanager create-secret --name staging/smaart/secrets \
  --secret-string '{"MONGODB_URI":"...","JWT_SECRET":"...", ... }' --region $REGION
```
Then update the ARNs in `ecs-task-definition.json` (`secret:staging/smaart/secrets-XXXX`).

## 6. ECS Fargate service behind an ALB

- Cluster: `aws ecs create-cluster --cluster-name smaart-cluster`.
- Register the (reconciled) task def: `aws ecs register-task-definition --cli-input-json file://aws-deployment/ecs-task-definition.json`.
- Create an **ALB** (public subnets) + **target group** with health check path
  `/api/health` (this is the deep check — it returns 503 if Mongo is down).
- Create the ECS **service** (start with **1 task** for G3): rolling deploy,
  `minimumHealthyPercent: 100, maximumPercent: 200`, attach to the target group.
- TLS: request an **ACM** cert for `staging-api.smaartminds.com`; HTTPS listener
  on the ALB.

## 7. Frontend — S3 + CloudFront

```bash
# Build pointing the SPA at the staging API (same-origin or the API subdomain):
( cd front-end && VITE_API_URL=/api npm run build )
aws s3 sync front-end/dist s3://smaart-staging-frontend --delete
# Create a CloudFront distribution: default origin = the S3 bucket; add a
# behaviour that routes /api/* (and /socket.io, /uploads) to the ALB origin.
# (CloudFront here plays the same routing role our local Nginx did.)
```

## 8. Run the SAME tests against staging (this is "all the local things, as G3")

Point the existing scripts at the staging URL — no rewrites needed.

```bash
export STAGING=https://staging.smaartminds.com

# Seed test fixtures into the Atlas DB (run with the Atlas URI):
LOADTEST_MONGODB_URI="<atlas-uri>/smaart_staging" node back-end/scripts/seed-loadtest.js

# 1) Smoke + capacity (k6) — REAL numbers now (dedicated vCPU, external load):
docker run --rm -i -v "$PWD/loadtest:/loadtest" -e BASE_URL=$STAGING grafana/k6 run /loadtest/k6/smoke.js
docker run --rm -i -v "$PWD/loadtest:/loadtest" -e BASE_URL=$STAGING grafana/k6 run /loadtest/k6/steady.js
docker run --rm -i -v "$PWD/loadtest:/loadtest" -e BASE_URL=$STAGING grafana/k6 run /loadtest/k6/ramp.js

# 2) Browser E2E (Playwright):
docker run --rm -v "$PWD/loadtest:/loadtest" -w /loadtest/e2e -e BASE_URL=$STAGING \
  mcr.microsoft.com/playwright:v1.49.1-jammy bash -c "npm install --no-save @playwright/test@1.49.1 && npx playwright test"

# 3) Vulnerability scan (ZAP):
docker run --rm -v "$PWD/loadtest:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t $STAGING -I -r zap-staging.html
```

- **Load balancing** at G3 is verified via the ECS service running ≥2 tasks +
  ALB target-group health + CloudWatch `RequestCountPerTarget` (no `X-Upstream`
  header needed — the ALB does it).
- Watch **CloudWatch / Container Insights** for per-task CPU/memory under load.

## 9. Capture results, then TEAR DOWN

- Record p50/p95/p99, throughput, error rate, CPU/mem into
  `RESPONSE_UNITS_REPORT.md` — these are the **real** numbers that size G4
  (tasks needed for 10k = 10000 / per-task-N).
- **Tear down to stop charges:**
  ```bash
  aws ecs update-service --cluster smaart-cluster --service smaart-backend-service --desired-count 0
  # delete the service, ALB, target group, NAT, CloudFront, S3; pause/delete Atlas.
  ```

---

## How this maps to what we already did locally

| Local (done, free) | G3 (this runbook, real AWS) |
|---|---|
| `docker-compose.prod-local.yml` (Nginx + replicas) | ECS Fargate + ALB + CloudFront |
| Mongo container | MongoDB Atlas |
| `loadtest/k6/*` | same scripts, `BASE_URL=$STAGING` |
| `loadtest/e2e` Playwright | same suite, `BASE_URL=$STAGING` |
| ZAP scan | same scan vs `$STAGING` |
| `.env.local` dummy secrets | AWS Secrets Manager (rotated values) |

The CI/CD that automates steps 3 + 6 is in `.github/workflows/cd-deploy.yml`
(currently inactive — enable it after this runbook works by hand once).
