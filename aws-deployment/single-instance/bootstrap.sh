#!/usr/bin/env bash
# ============================================================================
# bootstrap.sh — issue the first TLS certificate. RUN ONCE, before the stack.
# ----------------------------------------------------------------------------
# Chicken-and-egg problem: edge.conf references certificate files, so the edge
# container cannot start until they exist — but Let's Encrypt needs to reach
# port 80 to prove you own the domain. This script breaks the loop by running
# a throwaway HTTP-only nginx just long enough to answer the ACME challenge.
#
# PREREQUISITES:
#   - DNS A records for app.<domain> and admin.<domain> BOTH already point at
#     this instance's Elastic IP, and have propagated (check with `dig`).
#   - Security group allows inbound 80 and 443 from 0.0.0.0/0.
#   - ./.env exists (copy deploy.env.example).
#
# USAGE:  ./bootstrap.sh
# ============================================================================
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "ERROR: .env not found. Run: cp deploy.env.example .env  (then edit it)" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; . ./.env; set +a

: "${APP_DOMAIN:?APP_DOMAIN must be set in .env}"
: "${ADMIN_DOMAIN:?ADMIN_DOMAIN must be set in .env}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL must be set in .env}"

PROJECT=smaart-prod
CONF_VOL="${PROJECT}_certbot-conf"
WWW_VOL="${PROJECT}_certbot-www"
TMP_NGINX=smaart-acme-bootstrap

echo "==> Creating certificate volumes"
docker volume create "$CONF_VOL" >/dev/null
docker volume create "$WWW_VOL"  >/dev/null

echo "==> Checking that port 80 is free"
if docker ps --format '{{.Ports}}' | grep -q ':80->'; then
  echo "ERROR: something already publishes port 80. Stop it first:" >&2
  echo "       docker compose -f docker-compose.prod.yml down" >&2
  exit 1
fi

cleanup() { docker rm -f "$TMP_NGINX" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "==> Starting temporary ACME responder on :80"
cat > /tmp/acme.conf <<'ACME'
server {
  listen 80 default_server;
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 404; }
}
ACME

docker run -d --name "$TMP_NGINX" \
  -p 80:80 \
  -v /tmp/acme.conf:/etc/nginx/conf.d/default.conf:ro \
  -v "$WWW_VOL":/var/www/certbot \
  nginx:alpine >/dev/null

# Give nginx a moment to bind before Let's Encrypt comes knocking.
sleep 3

echo "==> Requesting certificate for $APP_DOMAIN and $ADMIN_DOMAIN"
# Both names go on ONE certificate, filed under the first -d name. edge.conf
# points both server blocks at that same path — keep the order if you re-run.
docker run --rm \
  -v "$CONF_VOL":/etc/letsencrypt \
  -v "$WWW_VOL":/var/www/certbot \
  certbot/certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$APP_DOMAIN" \
    -d "$ADMIN_DOMAIN" \
    --email "$LETSENCRYPT_EMAIL" \
    --agree-tos --no-eff-email --non-interactive

echo "==> Certificate issued. Stopping the temporary responder."
cleanup
trap - EXIT

cat <<DONE

Done. The certificate lives in the '$CONF_VOL' volume and the certbot
service in docker-compose.prod.yml renews it automatically.

If APP_DOMAIN is not smaartinstitute.com, edit the server_name and
ssl_certificate paths in edge.conf to match before starting the stack.

Next:
  docker compose -f docker-compose.prod.yml up -d --build

DONE
