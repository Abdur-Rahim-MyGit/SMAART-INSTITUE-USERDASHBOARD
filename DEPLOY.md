# How to deploy SMAART

Live since 2026-08-22:

| Site | URL |
|---|---|
| Student dashboard | https://smaartinstitute.com |
| Admin panel | https://admin.smaartinstitute.com |

Both run in Docker on one EC2 instance (`smaart-prod`, `13.207.12.89`, Mumbai).

---

## The one rule

> **Pushing code does NOT put it live.**
>
> Images build automatically. Someone has to click **Deploy** before students see anything.

That gate is deliberate. Code can sit built and waiting for days.

---

## What happens automatically when someone pushes to `main`

| Repo pushed to | What runs | Result |
|---|---|---|
| `SMAART-INSTITUE-USERDASHBOARD` | `Build & Push Images (user dashboard)` + `CI` | 2 images in GHCR (~4 min) |
| `ADMIN-SMAART-INSTITUTE-26` | `Build & Push Images (admin panel)` + `CI/CD Pipeline` | 2 images in GHCR (~3 min) |

Images are tagged with the commit SHA **and** `latest`. The live site is untouched.

---

## Deploying — the 4 steps

**1. Check the build passed.**

Go to the Actions tab of whichever repo was pushed to. Find **Build & Push Images**.

- ✅ Green → carry on
- ❌ Red → **do not deploy.** The code doesn't build. Send it back to the developer.

**2. Open the deploy workflow.**

Always in **this** repo (`SMAART-INSTITUE-USERDASHBOARD`), even for admin changes:

**Actions** → **Deploy to production**

**3. Run it.**

Grey **Run workflow ⌄** → leave both boxes as `latest` → green **Run workflow**.

(There are two buttons with the same name. The grey one opens the panel; the
**green** one inside it actually starts the deploy.)

**4. Wait ~50 seconds.**

Green tick = done and verified.

---

## Why the button is only in this repo

`aws-deployment/single-instance/docker-compose.prod.yml` runs **both** apps as one
stack, and it lives here. Deploying restarts that stack, so it is driven from one
place — two deploy buttons could run at once and collide mid-restart.

⚠️ The admin repo still shows a workflow called **"Deploy Admin to EC2"**. That is
the OLD pm2/system-nginx one, kept only as a record. It is manual-only and its
jobs skip. **Never use it.**

---

## What a deploy actually does

1. Records the currently running image tags (for rollback)
2. `git pull` on the server — picks up compose/nginx config changes
3. Logs in to GHCR and pulls the four images
4. `up -d --no-build` — swaps containers; the server never compiles anything
5. Health-checks both sites **and** `"db":"connected"`, up to 20 tries over ~100s
6. Healthy → done. Unhealthy → **rolls back automatically** and fails the run

| | |
|---|---|
| Duration | ~50 seconds |
| Downtime | ~30 seconds |
| Manual checking afterwards | **Not needed** — green means verified |

---

## Rolling back

Same button. Instead of `latest`, enter the **commit SHA** of the last good
version (find it in the Actions history, or on the commit in GitHub).

Every build is kept in GHCR, so any previous version is one click away.

---

## Quick reference

| Situation | Do this |
|---|---|
| Code pushed, want it live | Actions → Deploy to production → `latest` → Run |
| Deploy run went red | Nothing — it already rolled back. Read the log |
| Undo a *successful* deploy | Same button, enter the previous commit SHA |
| Build went red | Don't deploy. It's a code problem |
| Only admin changed | Same as normal — deploy with both tags at `latest` |
| GitHub down, urgent fix | SSH in, then `docker compose -f docker-compose.prod.yml up -d --build` |

---

## Checking the site yourself

```bash
curl -sI https://smaartinstitute.com | head -1
curl -s  https://smaartinstitute.com/api/health
curl -sI https://admin.smaartinstitute.com | head -1
```

Healthy looks like `HTTP/2 200` and `{"status":"Server is running","db":"connected"}`.

On the server:

```bash
cd /opt/smaart/SMAART-INSTITUE-USERDASHBOARD/aws-deployment/single-instance
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50 user-backend
```

All six containers should read `Up`. `Restarting` means one is crash-looping —
check its logs.

---

Full server setup, DNS, certificates and known gotchas:
[aws-deployment/single-instance/README.md](aws-deployment/single-instance/README.md)
