This is a pure analysis/estimation task — no codebase investigation needed. I'll produce the cost estimate directly.

# SMAART Platform — AWS Monthly Cost Estimate (ap-south-1 Mumbai)

**FX assumption:** ~₹83 / USD. **Pricing basis:** ap-south-1 (Mumbai) on-demand list prices, mid-2025/2026 levels. AI/LLM (OpenRouter/OpenAI) and Cloudinary are **third-party SaaS — billed outside AWS** and called out separately. All figures are **realistic estimates**, not billing guarantees.

## Architecture assumptions

| Item | Assumption |
|---|---|
| Scale | Tier A: ~1,000 active users / low concurrency. Tier B: ~5,000 active users, peak ~300-500 concurrent websocket connections |
| Backend | Express/Node, persistent websockets, outbound AI/email/upload calls |
| Frontend | React static build (SPA) — served from S3 + CloudFront, **not** from ECS |
| DB | MongoDB — recommend **MongoDB Atlas on AWS Mumbai** (managed, billed via Atlas/AWS Marketplace) |
| Media | Cloudinary (SaaS, external) |
| Region | ap-south-1, single region |
| Traffic | Tier A ~150-300 GB egress/mo; Tier B ~1-2 TB egress/mo |

---

## Tier A — Budget-friendly / Startup Launch (~1,000 users)

Single-AZ-tolerant but production-hygiene compliant (managed DB, HTTPS, secrets, logs, backups).

| Service | Size / Config | USD/mo | INR/mo |
|---|---|---:|---:|
| **ECS Fargate** (backend) | 1 task, 0.5 vCPU / 1 GB, 24×7 (~1 task always-on) | ~$18 | ~₹1,500 |
| **ALB** | 1 ALB, low LCU (websockets need sticky long-lived conns) | ~$20 | ~₹1,660 |
| **MongoDB Atlas M10** | Dedicated M10, AWS Mumbai, 10 GB, daily backup | ~$60 | ~₹4,980 |
| **ECR** | ~5 GB image storage | ~$0.50 | ~₹40 |
| **CloudWatch** | Logs ~5 GB ingest + few alarms/metrics | ~$5 | ~₹415 |
| **Secrets Manager** | ~5 secrets | ~$2 | ~₹166 |
| **NAT Gateway** | 1 NAT, ~50 GB processed *(or skip — see note)* | ~$35 | ~₹2,905 |
| **S3** (frontend + uploads) | ~20 GB + requests | ~$1 | ~₹83 |
| **CloudFront** | ~200 GB egress (frontend + cached) | ~$17 | ~₹1,410 |
| **Route 53** | 1 hosted zone + queries | ~$1 | ~₹83 |
| **ACM** | TLS certs (public) | $0 | ₹0 |
| **WAF** | Optional at this tier — 1 ACL + few rules | ~$8 | ~₹664 |
| **Data transfer** | Misc inter-AZ / direct egress | ~$5 | ~₹415 |
| **Subtotal (with WAF + NAT)** | | **~$172** | **~₹14,300** |
| **Lean subtotal (no WAF, no NAT*)** | | **~$129** | **~₹10,700** |

\* **Budget NAT tip:** A single NAT Gateway (~$35/mo + data) is often the largest "hidden" line item at startup scale. If your tasks only need outbound internet (AI/email/Cloudinary) and you don't run them in private subnets for compliance reasons, you can run the Fargate task in a **public subnet with a public IP** and skip NAT entirely — saving ~$35/mo while still being production-acceptable for a single-service launch. Add NAT back the moment you have a compliance/security requirement for private subnets.

---

## Tier B — Recommended Production-Professional (HA, autoscaling, ~5,000 users)

Multi-AZ, autoscaling, WAF on, redundant NAT, larger managed DB with HA.

| Service | Size / Config | USD/mo | INR/mo |
|---|---|---:|---:|
| **ECS Fargate** (backend) | 2-6 tasks autoscaling, 1 vCPU / 2 GB; baseline ~3 tasks 24×7 | ~$130 | ~₹10,800 |
| **ALB** | 1 ALB, higher LCU (websocket concurrency, more new conns) | ~$30 | ~₹2,490 |
| **MongoDB Atlas M30** | Dedicated M30, 3-node replica set, AWS Mumbai, ~40 GB, PITR backup | ~$540 | ~₹44,800 |
| **ECR** | ~10 GB + cross-AZ pulls | ~$1.50 | ~₹125 |
| **CloudWatch** | ~30 GB logs, dashboards, alarms, Container Insights | ~$40 | ~₹3,320 |
| **Secrets Manager** | ~10 secrets + rotation | ~$5 | ~₹415 |
| **NAT Gateway** | 2 NAT (1 per AZ for HA), ~400 GB processed | ~$110 | ~₹9,130 |
| **S3** (frontend + uploads) | ~80 GB + requests + versioning | ~$3 | ~₹250 |
| **CloudFront** | ~1.5 TB egress + requests | ~$125 | ~₹10,375 |
| **Route 53** | Hosted zone + health checks + higher queries | ~$3 | ~₹250 |
| **ACM** | Public TLS certs | $0 | ₹0 |
| **WAF** | 1 ACL, managed rule groups, ~10M requests | ~$25 | ~₹2,075 |
| **Data transfer** | Inter-AZ replication, direct egress | ~$30 | ~₹2,490 |
| **Subtotal** | | **~$1,043** | **~₹86,500** |

> Add **20-30% buffer** for spikes, support plan, and metric/API overages → realistic Tier B planning number **~$1,250-1,350/mo (~₹1,03,000-1,12,000/mo)**.

---

## Fargate vs EC2 — Recommendation

**Use Fargate for both launch and early production.** Rationale:

- **No cluster management.** A launch-stage company should not pay an engineer to patch/scale EC2 container hosts. Fargate removes EC2, AMI patching, and capacity planning.
- **Websockets are fine on Fargate** behind an ALB (long-lived connections supported; just tune idle timeout and use connection draining).
- **Cost crossover:** EC2 (especially with Savings Plans / Spot) becomes cheaper only at sustained high CPU/RAM (~8-15+ vCPUs running 24×7). Below that, Fargate's premium (~20-30% per vCPU-hr) is far cheaper than the engineering time EC2 costs.
- **When to switch to EC2:** once your steady-state compute exceeds roughly **8-10 vCPUs 24×7** and you can commit to a 1-yr Savings Plan, EC2 + Cluster Auto Scaling saves meaningful money. At ~5,000 users you are **not** there yet — stay on Fargate.
- **Cost lever regardless:** buy a **1-year Fargate Compute Savings Plan** for the always-on baseline (~30% off the steady tasks) once load is predictable.

## MongoDB: Atlas vs DocumentDB vs self-managed

| Option | Verdict |
|---|---|
| **MongoDB Atlas on AWS Mumbai** | **Recommended.** True MongoDB, managed HA, backups, PITR, scaling, peering into your VPC. M10 launch → M30 prod. Billed via Atlas (USD), deploys in ap-south-1. |
| **DocumentDB** | AWS-native, but **not 100% MongoDB-compatible** (lags driver/feature versions; can break aggregation/operators). Min HA cluster (~3× t3/r6g) often costs **more** than Atlas M30 with worse compatibility. Avoid unless you want everything inside AWS billing. |
| **Self-managed on EC2** | Cheapest raw compute, but you own replica-set ops, backups, upgrades, security. **Not recommended** — false economy for a small team. |

---

## (C) What scales the cost — the real cost drivers

1. **MongoDB tier** — biggest single line item. M10→M30→M40 roughly doubles each step. Right-size by working-set RAM, not disk. Single largest lever in both tiers.
2. **CloudFront / data egress** — scales directly with media-heavy traffic and frontend bundle size. Offload media to Cloudinary (you already do) so CloudFront mostly serves the cached SPA. Egress is the #1 surprise bill at scale.
3. **Fargate task count** — autoscaling on websocket concurrency / CPU. Persistent websockets pin memory, so connections-per-task caps how low you scale. More concurrent users = more always-on tasks.
4. **NAT Gateway data processing** — every outbound AI/Cloudinary/email byte through NAT is billed (~$0.045/GB processed + hourly). Heavy AI payloads inflate this. Use a **VPC Gateway Endpoint for S3** (free) and consider interface endpoints only if they pay off.
5. **CloudWatch Logs ingestion** — verbose app/websocket logging silently balloons. Set retention (7-30 days) and sample debug logs.
6. **WAF requests** — scales with request volume; managed rule groups add per-rule + per-request cost.
7. **NOT on the AWS bill (track separately):** **OpenRouter/OpenAI** token spend (can dwarf all AWS costs — easily $200-$2,000+/mo depending on model and volume), **Cloudinary** plan (~$0-$224+/mo), and any **email** provider (SES is cheap at ~$0.10/1k; 3rd-party like SendGrid/Postmark is separate).

---

## Bottom line

| Tier | USD/mo | INR/mo |
|---|---:|---:|
| **A — Lean launch** (no WAF/NAT, Fargate, Atlas M10) | **~$130** | **~₹10,700** |
| **A — Launch w/ WAF + NAT** | **~$172** | **~₹14,300** |
| **B — Production HA** (raw) | **~$1,043** | **~₹86,500** |
| **B — Production HA** (planning w/ buffer) | **~$1,250-1,350** | **~₹1.03-1.12 L** |

**Recommended budget-friendly path that still follows production rules:** Fargate (1 task, Savings Plan when stable) + **MongoDB Atlas M10** (managed HA + backups = the production-grade part) + ALB + S3/CloudFront for the React SPA + ACM (free TLS) + Secrets Manager + scoped CloudWatch retention. Start with WAF in **count mode** and a **single NAT** (or public-subnet task to skip NAT). This lands around **$130-175/mo (~₹11,000-14,500/mo)** while keeping managed DB, HTTPS, secrets, backups, and logging — the things that actually make it "production." Remember to budget AI/LLM and Cloudinary **separately**, as those often exceed your entire AWS bill.

*Note: AWS list prices drift and Atlas/3rd-party SaaS pricing changes — validate against the AWS Pricing Calculator and live Atlas quotes before committing budget.*