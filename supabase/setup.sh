#!/usr/bin/env bash
# One-step setup (and update) of the Maths Practice online logins on Supabase (free plan, no card):
#   1. signs in to Supabase (opens the browser: "Continue with GitHub")
#   2. creates the project (London) the first time
#   3. applies the database (tables and security rules), the auth settings and the admin function
#   4. makes your admin login
#   5. tells the website where the project is (GitHub repository variables) and rebuilds it
# Safe to run again: it updates what is there. The database password is kept in supabase/.db-password
# (never committed). Run with --new-admin to add another admin or reset your password.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"
REPO="IoloM/maths-practice"
NAME="maths-practice"
REGION="eu-west-2"
ORIGINS="https://iolom.github.io,http://localhost:5173,http://localhost:4173"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
S() { npx --no-install supabase "$@"; }
json() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const x=JSON.parse(s);process.stdout.write(String(($1)(x)??''))}catch(e){}})"; }

command -v node >/dev/null || { echo "Node.js is missing (expected in ~/.local/bin)."; exit 1; }
[ -x node_modules/.bin/supabase ] || { say "Installing tools…"; npm ci --no-audit --no-fund; }

say "1/5  Supabase sign-in"
if ! S projects list -o json >/dev/null 2>&1; then
  echo "A Supabase page opens in your browser: choose 'Continue with GitHub' and allow it."
  S login
fi

say "2/5  Project"
ORG="$(S orgs list -o json 2>/dev/null | json 'x=>x[0]&&x[0].id')"
if [ -z "$ORG" ]; then
  S orgs create "Maths Practice" >/dev/null
  ORG="$(S orgs list -o json | json 'x=>x[0]&&x[0].id')"
fi
REF="$(S projects list -o json | json "x=>(x.find(p=>p.name==='$NAME')||{}).id")"
if [ ! -f supabase/.db-password ]; then
  node -e 'process.stdout.write(require("crypto").randomBytes(24).toString("base64url"))' > supabase/.db-password
  chmod 600 supabase/.db-password
fi
DBPASS="$(cat supabase/.db-password)"
if [ -z "$REF" ]; then
  echo "Creating the project (free plan, London)…"
  REF="$(S projects create "$NAME" --org-id "$ORG" --db-password "$DBPASS" --region "$REGION" -o json | json 'x=>x.id||x.ref')"
fi
[ -n "$REF" ] || { echo "Couldn't find or create the project — see the messages above."; exit 1; }
echo "Project: $REF — waiting until it's ready…"
for _ in $(seq 1 60); do
  STATUS="$(S projects list -o json | json "x=>(x.find(p=>p.id==='$REF')||{}).status")"
  [ "$STATUS" = "ACTIVE_HEALTHY" ] && break
  sleep 10
done
URL="${SUPABASE_URL_OVERRIDE:-https://$REF.supabase.co}" # the override is for testing this script

say "3/5  Database, sign-in settings and the admin function"
S link --project-ref "$REF" -p "$DBPASS" >/dev/null
S db push --linked -p "$DBPASS" --yes
S config push --project-ref "$REF" --yes >/dev/null
S secrets set "ALLOWED_ORIGINS=$ORIGINS" --project-ref "$REF" >/dev/null
S functions deploy admin --project-ref "$REF" --use-api --no-verify-jwt

KEYS="$(S projects api-keys --project-ref "$REF" --reveal -o json)"
PUBLISHABLE="$(printf '%s' "$KEYS" | json 'x=>(x.find(k=>String(k.api_key).startsWith("sb_publishable_"))||x.find(k=>k.name==="anon")||{}).api_key')"
SECRET="$(printf '%s' "$KEYS" | json 'x=>(x.find(k=>String(k.api_key).startsWith("sb_secret_"))||x.find(k=>k.name==="service_role")||{}).api_key')"
[ -n "$PUBLISHABLE" ] && [ -n "$SECRET" ] || { echo "Couldn't read the project's API keys."; exit 1; }
case "$PUBLISHABLE" in sb_publishable_*) ;; *) echo "(Using the older API keys: create new ones under Project Settings → API Keys and run this again before the end of 2026.)" ;; esac

say "4/5  Your admin login"
ADMINS="$(SUPABASE_URL="$URL" SECRET_KEY="$SECRET" node -e '
  const k = process.env.SECRET_KEY;
  fetch(process.env.SUPABASE_URL + "/rest/v1/profiles?select=id&admin=eq.true", { headers: { apikey: k, ...(k.startsWith("eyJ") ? { authorization: "Bearer " + k } : {}) } })
    .then((r) => r.json()).then((x) => process.stdout.write(String(Array.isArray(x) ? x.length : ""))).catch(() => {});')"
if [[ "$ADMINS" =~ ^[1-9][0-9]*$ ]] && [[ " $* " != *" --new-admin "* ]]; then
  echo "You already have an admin login. (Run with --new-admin to add another or reset your password.)"
else
  echo "This is the login you use to make logins for other people (it works on every device)."
  read -r -p "Your name (shown in the app): " ANAME
  while :; do
    read -r -p "Choose a username (lower case, e.g. iolo): " AUSER
    AUSER="$(printf '%s' "$AUSER" | tr '[:upper:]' '[:lower:]' | tr -d ' ')"
    [[ "$AUSER" =~ ^[a-z0-9][a-z0-9._-]{0,30}[a-z0-9]$ ]] && break
    echo "2–32 letters, numbers, dots, dashes or underscores, please."
  done
  while :; do
    read -rs -p "Choose a password (6+ characters; nothing shows as you type): " P1; echo
    read -rs -p "Type it again: " P2; echo
    [ "$P1" = "$P2" ] && [ ${#P1} -ge 6 ] && break
    echo "They didn't match, or it's shorter than 6 characters — try again."
  done
  SUPABASE_URL="$URL" SECRET_KEY="$SECRET" ADMIN_USER="$AUSER" ADMIN_NAME="${ANAME:-$AUSER}" ADMIN_PASSWORD="$P1" node supabase/scripts/make-admin.mjs
  unset P1 P2
fi

say "5/5  Connecting the website"
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh variable set SUPABASE_URL --repo "$REPO" --body "$URL"
  gh variable set SUPABASE_PUBLISHABLE_KEY --repo "$REPO" --body "$PUBLISHABLE"
  gh workflow run deploy.yml --repo "$REPO" --ref main
  echo "The website is rebuilding with online logins (about 10 minutes)."
else
  echo "GitHub CLI isn't signed in: set repository variables SUPABASE_URL=$URL and SUPABASE_PUBLISHABLE_KEY, then re-run the deploy workflow."
fi
unset SECRET KEYS

say "Done."
echo "Project:      $URL"
[ -n "${AUSER:-}" ] && echo "Admin login:  $AUSER (with the password you chose)"
echo "Next: in about 10 minutes open the app → Settings → Sign in, then Manage logins to make logins for people."
