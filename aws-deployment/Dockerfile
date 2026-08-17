# Stage 1: Build & Dependencies
# Node 20 went end-of-life in April 2026 — stay on the active LTS line so the
# base OS keeps receiving CVE fixes.
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies required for native builds (if any)
RUN apk add --no-cache python3 make g++ git

# Copy dependency files first to utilize Docker layer cache
# (.npmrc carries the legacy-peer-deps setting npm ci needs — see back-end/.npmrc)
COPY package*.json .npmrc ./

# Install production dependencies deterministically
RUN npm ci --omit=dev

# Copy application source code (development configs, test files, and docs are ignored via .dockerignore)
COPY . .

# Stage 2: Hardened Runtime Environment
FROM node:22-alpine AS runner

# Set metadata labels for container auditing
LABEL org.opencontainers.image.source="https://github.com/Abdur-Rahim-MyGit/SMAART-INSTITUE-USERDASHBOARD" \
      org.opencontainers.image.description="Secure Production Backend Container for SMAART Minds" \
      org.opencontainers.image.vendor="SMAART Minds"

# Pull in Alpine security updates published after the base image was built, and
# strip npm/npx/corepack/yarn — the runtime is plain `node server.js`, and the
# npm toolchain's vendored deps (tar, brace-expansion, …) are the largest
# source of scanner findings in node images.
RUN apk upgrade --no-cache && \
    rm -rf /usr/local/lib/node_modules \
           /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn*

WORKDIR /usr/src/app

# The app creates logs/ and uploads/ at runtime as the `node` user, so the app
# directory itself must belong to it (the dir only — recursing over the copied
# files would duplicate them all into an extra layer).
RUN chown node:node /usr/src/app

# Copy production node_modules and files from the builder stage, owned by the
# non-root user directly. (A separate `RUN chown -R` would duplicate every file
# into an extra image layer — slower, bigger, and needless I/O.)
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app ./

# Run container as non-privileged system user
USER node

# Expose backend port
EXPOSE 5000

# Run in production mode
ENV NODE_ENV=production

# Node.js process options:
# 1. --max-old-space-size=450: Limits Node V8 heap size to 450MB inside a 512MB RAM Fargate Container,
#    preventing the OS from silently terminating the container (OOM Killer) by letting Node trigger GC early.
# 2. --disable-proto=delete: Mitigates Prototype Pollution vulnerabilities in third-party libraries.
ENV NODE_OPTIONS="--max-old-space-size=450 --disable-proto=delete"

# Hardened health check to ensure container status is actively monitored by AWS ECS
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "server.js"]
