# SMAART Institute — User Dashboard

The student-facing application of the SMAART Institute platform, live at
**[smaartinstitute.com](https://smaartinstitute.com)**.

This repository also holds the production stack that runs *both* applications — the student
dashboard and the [admin panel](https://github.com/Abdur-Rahim-MyGit/ADMIN-SMAART-INSTITUTE-26) —
which is why deployment is driven from here.

## Start here

| I want to… | Go to |
|---|---|
| Understand the whole platform | **[My Project Document](My%20Project%20Document/)** — the overview deck, the System Document and the Hosting document |
| Deploy a change | [`DEPLOY.md`](DEPLOY.md) |
| Set up or rebuild the server | [`aws-deployment/single-instance/README.md`](aws-deployment/single-instance/README.md) |
| Find an audit, plan or older report | [`Documentation/`](Documentation/) |

## Layout

| Path | What it is |
|---|---|
| `front-end/` | The student application — React 19, Vite, Tailwind CSS |
| `back-end/` | Its API — Node.js, Express, MongoDB (Mongoose) |
| `mobile-app/` | The mobile application |
| `aws-deployment/` | The production Docker stack, edge proxy config and server runbook |
| `loadtest/` | Load-testing and end-to-end browser test harness |
| `nginx/` | Local Nginx configuration |
| `My Project Document/` | The presentation-ready documentation set |
| `Documentation/` | The working documentation history — see its own README |
| `Brand/` | Logo files in every variant |
| `Archive/` | Superseded scratch files and one-off scripts, kept out of the root |

## Running locally

```bash
# Backend  (needs back-end/.env)
cd back-end && npm install && npm run dev        # http://localhost:5000

# Frontend
cd front-end && npm install && npm run dev       # http://localhost:8080
```

Or the whole stack in Docker:

```bash
docker compose up --build -d                     # frontend :8081, backend :5000
```

## The one rule about deployment

Pushing to `main` builds images. It does **not** put anything live. Deploying is a separate,
manual step: **Actions → Deploy to production**. See [`DEPLOY.md`](DEPLOY.md).
