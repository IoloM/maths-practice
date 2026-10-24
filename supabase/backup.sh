#!/usr/bin/env bash
# Back up everyone's work from Supabase to this computer (backups/, never committed), or put one
# person's progress back to an earlier save:
#   supabase/backup.sh                         back up everything
#   supabase/backup.sh --restore <username> [n]   restore their save from n saves ago (default 1)
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"
REF="$(npx --no-install supabase projects list -o json 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{process.stdout.write((JSON.parse(s).find(p=>p.name==='maths-practice')||{}).id||'')}catch{}})")"
[ -n "$REF" ] || { echo "Not signed in to Supabase — run supabase/setup.sh first."; exit 1; }
SECRET="$(npx --no-install supabase projects api-keys --project-ref "$REF" --reveal -o json 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const x=JSON.parse(s);process.stdout.write(((x.find(k=>String(k.api_key).startsWith('sb_secret_'))||x.find(k=>k.name==='service_role'))||{}).api_key||'')})")"
export SUPABASE_URL="https://$REF.supabase.co" SECRET_KEY="$SECRET"
if [ "${1:-}" = "--restore" ]; then
  USERNAME="${2:?username}" SAVES_AGO="${3:-1}" node supabase/scripts/restore.mjs
else
  node supabase/scripts/backup.mjs
fi
