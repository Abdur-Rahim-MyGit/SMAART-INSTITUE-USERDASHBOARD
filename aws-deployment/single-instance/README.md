# Single-instance deployment — user dashboard + admin panel on one EC2 box

Runs both SMAART apps on one machine as two separate nginx virtual hosts:

| Hostname | Serves | Backend |
|---|---|---|
| `smaartinstitute.com` | User dashboard (Vite/React) | user-backend `:5000` |
| `admin.smaartinstitute.com` | Admin panel (CRA/React) | admin-backend `:5001` |

Only the `edge` container publishes host ports (80/443). Every app container is
internal-only on a shared Docker network. This is what makes co-hosting work:
both repos' own compose files publish host ports and the admin one claims `:80`,
so they cannot both run unmodified.

---

## 1. Launch the instance

| Setting | Value |
|---|---|
| Region | ap-south-1 (Mumbai) |
| AMI | Ubuntu Server **26.04 LTS** (Resolute) — 24.04 LTS also fine, just supported 2 years less. Docker publishes packages for both, and the install commands below detect the release automatically. |
| Instance type | **t3.medium (4 GiB) minimum**, t3.large (8 GiB) if building both frontends on the box |
| Storage | **40 GiB gp3** |
| Security group | 22 from **your IP only**; 80 and 443 from `0.0.0.0/0`. Nothing else. |

Do **not** open 5000 or 5001 — both backends sit behind the edge proxy.

`t3.micro` is not viable: a CRA production build alone exceeds 1 GiB.

Then **allocate an Elastic IP and attach it**, or the public IP changes on every
stop/start and breaks both DNS and the Atlas allowlist.

## 2. Prepare the box

```bash
# Docker
sudo apt-get update && sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc >/dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker

# 4 GB swap — insurance for the frontend builds, harmless afterwards
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 3. Clone both repos — layout matters

The build contexts in `docker-compose.prod.yml` are relative paths. This exact
layout is required:

```
/opt/smaart/
├── SMAART-INSTITUE-USERDASHBOARD/
│   └── aws-deployment/single-instance/   <- you run compose from here
└── SMAART-INSTITUTE-ADMIN/
```

Both repos are **private**, so the instance needs its own read-only credentials.
Use GitHub **deploy keys** — one per repo, read-only, revocable, and scoped to a
single repository. Do NOT put your personal GitHub password or a broad token on
the server.

**a) Generate one key per repo, on the EC2 instance:**

```bash
ssh-keygen -t ed25519 -C "ec2-smaart-dashboard" -f ~/.ssh/dashboard_key -N ""
ssh-keygen -t ed25519 -C "ec2-smaart-admin"     -f ~/.ssh/admin_key     -N ""
cat ~/.ssh/dashboard_key.pub
cat ~/.ssh/admin_key.pub
```

**b) Add each public key to its own repo on GitHub:**

Repo → **Settings** → **Deploy keys** → **Add deploy key** → paste → leave
*Allow write access* **unchecked**.

| Paste this key | Into this repo |
|---|---|
| `dashboard_key.pub` | `Abdur-Rahim-MyGit/SMAART-INSTITUE-USERDASHBOARD` |
| `admin_key.pub` | `Abdur-Rahim-MyGit/ADMIN-SMAART-INSTITUTE-26` |

A deploy key can only be registered on ONE repo, which is why there are two.

**c) Tell SSH which key belongs to which repo:**

```bash
cat > ~/.ssh/config <<'EOF'
Host github-dashboard
  HostName github.com
  User git
  IdentityFile ~/.ssh/dashboard_key
  IdentitiesOnly yes

Host github-admin
  HostName github.com
  User git
  IdentityFile ~/.ssh/admin_key
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
```

Test both (each should say "successfully authenticated"):

```bash
ssh -T git@github-dashboard
ssh -T git@github-admin
```

**d) Clone — the destination folder names are NOT optional:**

```bash
sudo mkdir -p /opt/smaart && sudo chown $USER:$USER /opt/smaart && cd /opt/smaart
git clone git@github-dashboard:Abdur-Rahim-MyGit/SMAART-INSTITUE-USERDASHBOARD.git SMAART-INSTITUE-USERDASHBOARD
git clone git@github-admin:Abdur-Rahim-MyGit/ADMIN-SMAART-INSTITUTE-26.git         SMAART-INSTITUTE-ADMIN
```

⚠️ The admin repo is named `ADMIN-SMAART-INSTITUTE-26` on GitHub but **must** be
cloned into a folder called `SMAART-INSTITUTE-ADMIN`, because that is the path
`docker-compose.prod.yml` builds from. The trailing folder name above does that
— don't drop it.

## 4. Environment files

The two application `.env` files are gitignored, so cloning does NOT bring them.
Copy them up from your laptop by hand. Run these in **PowerShell on your laptop**
(not on the server), substituting your `.pem` path and the Elastic IP:

```powershell
scp -i C:\path\to\smaart-key.pem `
  "C:\Users\dhars\Desktop\SMAART-INSTITUTE\SMAART-INSTITUE-USERDASHBOARD\back-end\.env" `
  ubuntu@ELASTIC_IP:/opt/smaart/SMAART-INSTITUE-USERDASHBOARD/back-end/.env

scp -i C:\path\to\smaart-key.pem `
  "C:\Users\dhars\Desktop\SMAART-INSTITUTE-ADMIN\Backend\.env" `
  ubuntu@ELASTIC_IP:/opt/smaart/SMAART-INSTITUTE-ADMIN/Backend/.env
```

Lock them down once they land:

```bash
chmod 600 /opt/smaart/SMAART-INSTITUE-USERDASHBOARD/back-end/.env
chmod 600 /opt/smaart/SMAART-INSTITUTE-ADMIN/Backend/.env
```

### Create the uploads directories BEFORE the first start

`back-end/uploads/` is gitignored, so a fresh clone does not contain it. Docker
then creates the bind-mount source itself — owned by **root**. The user backend
runs as the non-root `node` user (uid 1000), so it cannot write there and dies
on boot with:

```
Error: EACCES: permission denied, mkdir '/usr/src/app/uploads/proctoring'
```

The container restart-loops while every other service looks healthy, which makes
it read like an application bug. Pre-create the directories with the right owner
instead:

```bash
mkdir -p /opt/smaart/SMAART-INSTITUE-USERDASHBOARD/back-end/uploads
mkdir -p /opt/smaart/SMAART-INSTITUTE-ADMIN/Backend/uploads
sudo chown -R 1000:1000 /opt/smaart/SMAART-INSTITUE-USERDASHBOARD/back-end/uploads
```

The admin backend does not hit this — its Dockerfile sets no `USER`, so it runs
as root and can write into a root-owned mount. That difference is why only one
of the two backends fails.

If you have already hit it, the fix is the same `chown` followed by
`docker compose -f docker-compose.prod.yml restart user-backend`.

Then the deploy config:

```bash
cd /opt/smaart/SMAART-INSTITUE-USERDASHBOARD/aws-deployment/single-instance
cp deploy.env.example .env   # edit APP_DOMAIN / ADMIN_DOMAIN / LETSENCRYPT_EMAIL
```

`FRONTEND_URL` for both backends is set by the compose file — do not also set it
in the application `.env` files, or the compose value silently wins and you will
debug the wrong file.

## 5. DNS, then certificates

Point both A records at the Elastic IP and wait for propagation:

```bash
dig +short smaartinstitute.com
dig +short admin.smaartinstitute.com
```

Also add the Elastic IP to **MongoDB Atlas → Network Access**, or both backends
fail to connect on startup.

Then issue the certificate (once):

```bash
chmod +x bootstrap.sh
./bootstrap.sh
```

## 6. Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f edge
```

On a t3.medium, expect the first build to take 10–20 minutes — the user
dashboard alone carries 218 MB of face-api model assets.

## 7. Verify

```bash
curl -I https://smaartinstitute.com                     # 200, SPA
curl -s https://smaartinstitute.com/api/health          # backend healthy
curl -I https://admin.smaartinstitute.com                   # 200, admin SPA
curl -I http://smaartinstitute.com                      # 301 -> https
```

In the browser, confirm on the admin panel that a page reading student data
loads without CORS errors in the console — that path crosses from
`admin.smaartinstitute.com` to `smaartinstitute.com`.

---

## Redeploying

```bash
cd /opt/smaart/SMAART-INSTITUE-USERDASHBOARD && git pull
cd /opt/smaart/SMAART-INSTITUTE-ADMIN && git pull
cd /opt/smaart/SMAART-INSTITUE-USERDASHBOARD/aws-deployment/single-instance
docker compose -f docker-compose.prod.yml up -d --build
```

Frontend API URLs are **baked in at build time**, so changing `APP_DOMAIN` or
`ADMIN_DOMAIN` requires `--build`, not just a restart.

---

## The URL conventions differ between the two apps

A frequent source of 404s. They are not the same and never have been:

| Variable | App | Includes `/api`? | Read at |
|---|---|---|---|
| `VITE_API_URL` | user frontend | **yes** | `src/**` (`\|\| "http://localhost:5000/api"`) |
| `REACT_APP_API_URL` | admin frontend | **no** — bare origin | `Frontend/src/utils/api.js:6` appends `/api` |
| `REACT_APP_STUDENT_API_URL` | admin frontend | **no** — bare origin | `Frontend/src/pages/Support/MyITSupport.js:72` |

`docker-compose.prod.yml` already encodes this. Don't "fix" it to be consistent.

---

## Before you go live

### ⛔ Still blocking — you must do this

**SMTP is dead.** The Gmail App Password returns `535 BadCredentials`, so no OTP
email sends from either app — meaning **nobody can log in**. Generate a new
Gmail App Password and update `SMTP_PASS` in both backends' `.env`, or move to
Amazon SES. This cannot be fixed in code; it needs a credential only you can
issue.

### ✅ Fixed in code (2026-08-22)

1. **OTP logging is now gated.** `back-end/utils/emailService.js` printed the
   code, email and name on every login. It is now wrapped in the same
   `NODE_ENV === 'development' || LOG_OTP === 'true'` check the admin backend
   uses. `docker-compose.prod.yml` never sets `LOG_OTP`, so production is silent.

2. **`ADMIN_SYSTEM_SECRET` rotated** to a fresh 64-char random value in
   `back-end/.env`, and the copy hardcoded in the admin repo at
   `Frontend/src/utils/studentApi.js` was removed. The stale literal in
   `back-end/scripts/.env.example` was blanked — it is a committed file, so a
   real value there is a published secret.

3. **`requireRole` bypass is gated by `NODE_ENV`.**
   `back-end/middleware/roleMiddleware.js` now matches `protect` and
   `protectOrBypass`: the `x-admin-bypass` header is ignored in production.
   Verified first that the admin backend never sends those headers, so nothing
   legitimate depends on it.

4. **Vision board OCR / NSFW 404 fixed.**
   `imageModeration.js` now defaults `VITE_API_URL` to `.../api` like every
   other call site and requests `/ocr/extract` and `/nsfw/check` relative to it,
   instead of producing `/api/api/...`.

### 🔍 Worth checking separately

`PRELAUNCH_AUDIT_ROUND2_2026-06-10.md` records a compromised MongoDB
credential (`souban:souban123`) alongside the admin secret, and states nothing
had been rotated at the time. The admin secret is done; **confirm whether the
Atlas database user was ever rotated** — that has to happen in the Atlas
console.

---

## Cost (ap-south-1, on-demand, approximate)

| Item | Monthly |
|---|---|
| t3.medium | ~$33 |
| t3.large | ~$67 |
| 40 GiB gp3 | ~$3.20 |
| Elastic IP | ~$3.60 |

Since Feb 2024 AWS bills **every** public IPv4 address at $0.005/hour, including
Elastic IPs attached to a running instance. The auto-assigned public IP the
instance launched with was already costing this, so attaching an Elastic IP is
not an extra charge — it just makes the address permanent. Releasing an Elastic
IP you are not using does save the ~$3.60/month.
