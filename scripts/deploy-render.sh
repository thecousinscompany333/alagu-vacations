#!/usr/bin/env bash
# Creates or redeploys the Alagu Vacations web service on Render (requires `render login` first).
set -euo pipefail
cd "$(dirname "$0")/.."

if ! render whoami &>/dev/null; then
  echo "Run: render login"
  exit 1
fi

# Load public Supabase vars from .env.local (no service role key on Render).
set -a
# shellcheck disable=SC1091
source .env.local
set +a

SERVICE_NAME="${RENDER_SERVICE_NAME:-alagu-vacations}"
REPO_URL="${RENDER_REPO_URL:-https://github.com/thecousinscompany333/alagu-vacations}"
REGION="${RENDER_REGION:-singapore}"
PLAN="${RENDER_PLAN:-free}"
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://${SERVICE_NAME}.onrender.com}"

existing="$(render services list -o json 2>/dev/null | node -e "
  const fs = require('fs');
  const list = JSON.parse(fs.readFileSync(0, 'utf8'));
  const hit = list.find((s) => s.service?.name === process.argv[1]);
  if (hit) console.log(hit.service.id);
" "$SERVICE_NAME" 2>/dev/null || true)"

if [[ -n "$existing" ]]; then
  echo "Deploying existing service $SERVICE_NAME ($existing)..."
  render deploys create "$existing" --wait --confirm
  echo "Live at: $SITE_URL"
  exit 0
fi

echo "Creating new Render web service: $SERVICE_NAME"
render services create \
  --name "$SERVICE_NAME" \
  --type web_service \
  --repo "$REPO_URL" \
  --branch main \
  --runtime node \
  --region "$REGION" \
  --plan "$PLAN" \
  --auto-deploy \
  --build-command "npm ci --include=dev && npm run build" \
  --start-command "npm start" \
  --health-check-path "/" \
  --env-var "NODE_VERSION=22" \
  --env-var "NODE_ENV=production" \
  --env-var "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}" \
  --env-var "NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  --env-var "NEXT_PUBLIC_SITE_URL=${SITE_URL}" \
  --env-var "NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}" \
  --env-var "TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY:-}" \
  --confirm \
  -o json

echo "After the first deploy, set NEXT_PUBLIC_SITE_URL to your actual *.onrender.com URL in the Render dashboard if it differs."