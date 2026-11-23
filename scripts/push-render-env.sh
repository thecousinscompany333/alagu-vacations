#!/usr/bin/env bash
# Update Supabase-related env vars on the Render service (requires render login).
set -euo pipefail
SERVICE_ID="${RENDER_SERVICE_ID:-srv-dc0npsm7bikc73bbtnrg}"
URL="${1:?Usage: push-render-env.sh <SUPABASE_URL> <ANON_KEY> [SITE_URL]}"
ANON="${2:?}"
SITE="${3:-https://alagu-vacations.onrender.com}"

render workspace set tea-dc0jsgbm8hqs73eohtsg --confirm 2>/dev/null || true

# render services update cannot set env vars; use Dashboard or API. Print for copy-paste:
cat <<EOF
Set in Render → alagu-vacations → Environment, then redeploy:

NEXT_PUBLIC_SUPABASE_URL=$URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON
NEXT_PUBLIC_SITE_URL=$SITE
EOF