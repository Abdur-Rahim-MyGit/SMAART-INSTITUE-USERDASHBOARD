# Cybersecurity, Authentication & Infrastructure Security Policies
Location: `/aws-deployment/security-policies.md`

This document details the cybersecurity controls, network isolation architecture, authentication policies, and least-privilege IAM configurations designed to protect the **SMAART Minds** application in production.

---

## 1. Network Traffic Isolation (Security Groups)

To block unauthorized traffic, implement three layers of network security groups (SGs) within the AWS VPC. No database or container backend should ever be exposed directly to the public internet.

```
[Internet] 
   │
   ▼ (Ports 80/443 HTTPS)
┌─────────────────────────────────┐
│     1. ALB Security Group       │ <── Allows public traffic
└─────────────────────────────────┘
   │
   ▼ (Port 5000 Private Route Only)
┌─────────────────────────────────┐
│     2. ECS Task Security Group  │ <── Only accepts traffic originating from ALB SG
└─────────────────────────────────┘
   │
   ▼ (Port 6379 Private Route Only)
┌─────────────────────────────────┐
│     3. Redis Security Group     │ <── Only accepts traffic originating from ECS SG
└─────────────────────────────────┘
```

### A. Application Load Balancer Security Group (`smaart-prod-alb-sg`)
*   **Inbound Rules:**
    *   Allow TCP Port `80` (HTTP) from `0.0.0.0/0` (IPv4) and `::/0` (IPv6). *(ALB redirects HTTP to HTTPS)*
    *   Allow TCP Port `443` (HTTPS) from `0.0.0.0/0` (IPv4) and `::/0` (IPv6).
*   **Outbound Rules:**
    *   Allow TCP Port `5000` destination to `smaart-prod-ecs-sg` (restricted to the ECS SG).

### B. ECS Backend Task Security Group (`smaart-prod-ecs-sg`)
*   **Inbound Rules:**
    *   Allow TCP Port `5000` (Backend API & WebSockets) **ONLY** from Source `smaart-prod-alb-sg`.
*   **Outbound Rules:**
    *   Allow TCP Port `443` (HTTPS) to `0.0.0.0/0` (required for calling external APIs like OpenAI, Cloudinary, and MongoDB Atlas).
    *   Allow TCP Port `80` (HTTP) to `0.0.0.0/0` (required for OS updates and package requests).
    *   Allow TCP Port `6379` destination to `smaart-prod-redis-sg` (restricted to the Redis SG).

### C. ElastiCache Redis Security Group (`smaart-prod-redis-sg`)
*   **Inbound Rules:**
    *   Allow TCP Port `6379` **ONLY** from Source `smaart-prod-ecs-sg`.
*   **Outbound Rules:**
    *   Restrict outbound traffic completely (None / Local VPC only).

---

## 2. Least-Privilege IAM Roles & Policies

Do not use root admin credentials to run your tasks. Create two distinct IAM roles for ECS Fargate.

### A. ECS Task Execution Role (`smaart-ecs-execution-role`)
This role is used by the AWS ECS agent to pull the Docker image and fetch secrets from Secrets Manager before starting the container.

*   **Trust Relationship:** `ecs-tasks.amazonaws.com`
*   **Attached Managed Policy:** `AmazonECSTaskExecutionRolePolicy`
*   **Custom Inline Secret Policy (Restricts secret reading to only our app secrets):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "ssm:GetParameters"
      ],
      "Resource": [
        "arn:aws:secretsmanager:ap-south-1:<AWS_ACCOUNT_ID>:secret:production/smaart/secrets-*"
      ]
    }
  ]
}
```

### B. ECS Task Role (`smaart-ecs-task-role`)
This role is used by the Node.js application process inside the container. It governs permissions for AWS API calls made from your code (e.g. sending emails via SES).

*   **Trust Relationship:** `ecs-tasks.amazonaws.com`
*   **Permissions:** (Empty by default. Add specific access like `ses:SendEmail` only if needed. Never grant administrative or wildcard permissions).

---

## 3. Database Security (MongoDB Atlas Protection)

1.  **VPC Peering Connection:** Enable VPC Peering between the AWS VPC CIDR (`10.0.0.0/16`) and the MongoDB Atlas project network.
2.  **IP Access Whitelist:**
    *   Remove public access (`0.0.0.0/0`).
    *   Whitelist the Private CIDR block of your ECS Task subnets (`10.0.0.0/16`).
    *   Whitelist the Elastic IP address of your AWS NAT Gateway.
3.  **Transit Encryption:** Ensure that your `MONGODB_URI` connection string includes `ssl=true` (or `tls=true`) and `retryWrites=true`. Mongoose 7/8 handles this by default.

---

## 4. HTTPS, SSL & Web Application Firewalls (WAF)

*   **SSL Protocol Standards:** For Route 53 to CloudFront, enforce TLS 1.3 as the default viewer protocol policy.
*   **ALB Cipher Security:** Set the ALB Listener SSL security policy to `ELBSecurityPolicy-TLS13-1-2-2021-06` to reject outdated, vulnerable cipher suites (like SSLv3, TLS 1.0, and TLS 1.1).
*   **AWS WAF Configuration:**
    *   Deploy **AWS WAF** (Web Application Firewall) in front of your ALB.
    *   Enable **AWS Managed Rulesets**:
        *   `AWSManagedRulesCommonRuleSet` (protects against OWASP Top 10 vulnerabilities like SQL injection and cross-site scripting).
        *   `AWSManagedRulesKnownBadInputsRuleSet` (blocks known malicious payloads and exploits).
        *   `AWSManagedRulesAmazonIpReputationList` (blocks bots, scrapers, and malicious scanning IPs).

---

## 5. Session Authentication & CORS Policy

*   **CORS (Cross-Origin Resource Sharing):** 
    As implemented in the backend, CORS is strictly locked down in production:
    ```javascript
    if (isProduction) {
      if (origin === frontendUrl) { // Only allows https://app.smaartminds.com
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
    ```
*   **Cookie Security:** When issuing JWTs or session identifiers via cookies, always enforce the following security parameters:
    *   `httpOnly: true` (prevents client-side scripts from reading the cookie, mitigating XSS token theft).
    *   `secure: true` (forces browser to only transmit the cookie over encrypted HTTPS connections).
    *   `sameSite: 'strict'` (mitigates Cross-Site Request Forgery - CSRF attacks).
*   **Express Security Headers (Helmet):** 
    The Express backend utilizes `helmet()` to automatically configure secure HTTP response headers, including:
    *   `Content-Security-Policy` (CSP) to restrict scripts/resources to trusted origins.
    *   `X-Frame-Options: SAMEORIGIN` (prevents clickjacking attacks).
    *   `X-Content-Type-Options: nosniff` (forces MIME-type matching).
