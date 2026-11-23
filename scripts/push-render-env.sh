#!/usr/bin/env bash
# Print Render environment variables for copy-paste (CLI cannot set env vars).
set -euo pipefail
cd "$(dirname "$0")/.."
SERVICE_ID="${RENDER_SERVICE_ID:-srv-dc0npsm7bikc73bbtnrg}"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

URL="${1:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
ANON="${2:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
SITE="${3:-${NEXT_PUBLIC_SITE_URL:-https://alagu-vacations.onrender.com}}"
TURNSTILE_SITE="${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-<from Cloudflare Turnstile>}"
TURNSTILE_SECRET="${TURNSTILE_SECRET_KEY:-<from Cloudflare Turnstile>}"

render workspace set tea-dc0jsgbm8hqs73eohtsg --confirm 2>/dev/null || true

cat <<EOF
Render → alagu-vacations ($SERVICE_ID) → Environment → Add from .env
Use **Save, rebuild, and deploy** (Turnstile needs a rebuild).

NEXT_PUBLIC_SUPABASE_URL=$URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON
NEXT_PUBLIC_SITE_URL=$SITE
NEXT_PUBLIC_TURNSTILE_SITE_KEY=$TURNSTILE_SITE
TURNSTILE_SECRET_KEY=$TURNSTILE_SECRET
EOF