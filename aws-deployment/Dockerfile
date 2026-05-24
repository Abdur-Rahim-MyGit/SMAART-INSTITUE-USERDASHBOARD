# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies required for native builds (if any)
RUN apk add --no-cache python3 make g++ git

# Copy dependency files first to utilize Docker layer cache
COPY package*.json ./

# Install production dependencies deterministically
RUN npm ci --only=production

# Copy application source code (development configs, test files, and docs are ignored via .dockerignore)
COPY . .

# Stage 2: Hardened Runtime Environment
FROM node:20-alpine AS runner

# Set metadata labels for container auditing
LABEL org.opencontainers.image.source="https://github.com/Abdur-Rahim-MyGit/SMAART-INSTITUE-USERDASHBOARD" \
      org.opencontainers.image.description="Secure Production Backend Container for SMAART Minds" \
      org.opencontainers.image.vendor="SMAART Minds"

WORKDIR /usr/src/app

# Copy production node_modules and files from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app ./

# Setup security permissions (avoid running container processes as root)
RUN chown -R node:node /usr/src/app && \
    chmod -R 750 /usr/src/app

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
