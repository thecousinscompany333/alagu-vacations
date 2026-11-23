#!/usr/bin/env bash
# Provision hosted Supabase (Mumbai), push schema/seed, create admin, and update Render.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Get a token: https://supabase.com/dashboard/account/tokens"
  echo "Then: export SUPABASE_ACCESS_TOKEN=sbp_..."
  exit 1
fi

PROJECT_NAME="${SUPABASE_PROJECT_NAME:-alagu-vacations}"
REGION="${SUPABASE_REGION:-ap-south-1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-you@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin@123}"
RENDER_SERVICE="${RENDER_SERVICE_ID:-srv-dc0npsm7bikc73bbtnrg}"
SITE_URL="${SITE_URL:-https://alagu-vacations.onrender.com}"

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  SUPABASE_DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  echo "Generated DB password (save this): $SUPABASE_DB_PASSWORD"
fi

npx supabase login --token "$SUPABASE_ACCESS_TOKEN"

ORG_ID="$(npx supabase orgs list --output-format json | node -e "
  const list = JSON.parse(require('fs').readFileSync(0,'utf8'));
  const org = list[0];
  if (!org?.id) { console.error('No org found'); process.exit(1); }
  console.log(org.id);
")"

echo "Creating project $PROJECT_NAME in $REGION..."
CREATE_JSON="$(npx supabase projects create "$PROJECT_NAME" --org-id "$ORG_ID" --db-password "$SUPABASE_DB_PASSWORD" --region "$REGION" --output-format json 2>/dev/null || true)"
REF="$(printf '%s' "$CREATE_JSON" | node -e "
  let s=''; process.stdin.on('data',d=>s+=d); process.stdin.on('end',()=>{
    try { const j=JSON.parse(s); console.log(j.id||j.ref||''); } catch { console.log(''); }
  });
")"

if [[ -z "$REF" ]]; then
  echo "Create failed or project exists; using existing linked project if any."
  REF="$(npx supabase projects list --output-format json | node -e "
    const list = JSON.parse(require('fs').readFileSync(0,'utf8'));
    const p = list.find(x => (x.name||'').toLowerCase().includes('alagu')) || list[0];
    if (!p) process.exit(1);
    console.log(p.id);
  ")"
fi

echo "Project ref: $REF"
npx supabase link --project-ref "$REF" --password "$SUPABASE_DB_PASSWORD" --yes
npx supabase db push --yes
if ! npx supabase db query -f supabase/seed.sql --remote --yes 2>/dev/null; then
  echo "Seed via CLI failed; paste supabase/seed.sql into Supabase SQL Editor once."
fi

KEYS="$(npx supabase projects api-keys --project-ref "$REF" --output-format json)"
URL="https://${REF}.supabase.co"
ANON="$(printf '%s' "$KEYS" | node -e "
  const k=JSON.parse(require('fs').readFileSync(0,'utf8'));
  const a=(Array.isArray(k)?k:k.data||[]).find(x=>x.name==='anon'||x.name==='publishable');
  console.log(a?.api_key||a?.key||'');
")"
SERVICE="$(printf '%s' "$KEYS" | node -e "
  const k=JSON.parse(require('fs').readFileSync(0,'utf8'));
  const a=(Array.isArray(k)?k:k.data||[]).find(x=>x.name==='service_role'||x.name==='secret');
  console.log(a?.api_key||a?.key||'');
")"

NEXT_PUBLIC_SUPABASE_URL="$URL" SUPABASE_SERVICE_ROLE_KEY="$SERVICE" \
  /opt/homebrew/Cellar/node/24.3.0/bin/node scripts/create-admin.mjs "$ADMIN_EMAIL" "$ADMIN_PASSWORD" 2>/dev/null || \
  NEXT_PUBLIC_SUPABASE_URL="$URL" SUPABASE_SERVICE_ROLE_KEY="$SERVICE" \
  node --input-type=module -e "
    import { createClient } from '@supabase/supabase-js';
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: created, error } = await admin.auth.admin.createUser({ email: process.argv[1], password: process.argv[2], email_confirm: true });
    if (error) throw error;
    await admin.from('admin_users').upsert({ user_id: created.user.id, role: 'admin' });
    console.log('Admin ready:', process.argv[1]);
  " "$ADMIN_EMAIL" "$ADMIN_PASSWORD"

# Update local .env.local (keep service role local only)
if grep -q '^NEXT_PUBLIC_SUPABASE_URL=' .env.local 2>/dev/null; then
  sed -i '' "s|^NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$URL|" .env.local
  sed -i '' "s|^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON|" .env.local
  sed -i '' "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=$SITE_URL|" .env.local
  sed -i '' "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE|" .env.local
else
  cat >> .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=$URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON
NEXT_PUBLIC_SITE_URL=$SITE_URL
SUPABASE_SERVICE_ROLE_KEY=$SERVICE
EOF
fi

chmod +x scripts/push-render-env.sh
./scripts/push-render-env.sh "$URL" "$ANON" "$SITE_URL"
if command -v render >/dev/null && [[ "${SKIP_RENDER_DEPLOY:-}" != "1" ]]; then
  echo "After setting Render env vars in the dashboard, run:"
  echo "  render deploys create $RENDER_SERVICE --wait --confirm"
fi

echo ""
echo "Hosted Supabase ready."
echo "  URL: $URL"
echo "  Admin: $ADMIN_EMAIL / $ADMIN_PASSWORD"
echo "  Site: $SITE_URL"
echo "In Supabase Dashboard → Authentication: Site URL = $SITE_URL"
echo "  Redirect URLs: ${SITE_URL}/**"