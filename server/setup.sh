#!/usr/bin/env bash
# One-step setup (and re-deploy) of the Maths Practice server: a Cloudflare Worker with a D1 database
# (the free plan is plenty). It runs logins, saved progress and sync.
#   1. signs in to Cloudflare (opens the browser the first time)
#   2. creates the database and its tables (once; new tables are added on later runs)
#   3. deploys the Worker
#   4. makes your admin login (first run), so you can make logins for other people in the app
#   5. optionally: built-in AI marking with a paid Anthropic API key (most people skip this)
#   6. tells the app where the server is (GitHub repository variable API_URL) and rebuilds the site
# Safe to run again: existing pieces are kept. Run with --skip-secrets to only re-deploy.
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:$PATH"
REPO="IoloM/maths-practice"
SKIP_SECRETS=0
for a in "$@"; do [ "$a" = "--skip-secrets" ] && SKIP_SECRETS=1; done

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
W() { npx --no-install wrangler "$@"; }

command -v node >/dev/null || { echo "Node.js is missing (expected in ~/.local/bin)."; exit 1; }
[ -d node_modules ] || { say "Installing the server's tools…"; npm ci --no-audit --no-fund; }

say "1/6  Cloudflare sign-in"
if ! W whoami 2>&1 | grep -q "You are logged in"; then
  echo "A Cloudflare page will open in your browser: sign in (or sign up, free) and click Allow."
  W login
fi
W whoami 2>&1 | grep -E "logged in|Account Name|│" | head -6 || true

say "2/6  Database"
if grep -q REPLACED_BY_SETUP_SCRIPT wrangler.toml; then
  find_id() { W d1 list --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const x=JSON.parse(s).find(d=>d.name==="maths-practice");process.stdout.write(x?x.uuid:"")}catch{}})'; }
  id="$(find_id)"
  if [ -z "$id" ]; then
    W d1 create maths-practice </dev/null >/dev/null
    id="$(find_id)"
  fi
  [ -n "$id" ] || { echo "Could not create the database — see the messages above."; exit 1; }
  sed -i.bak "s/REPLACED_BY_SETUP_SCRIPT/$id/" wrangler.toml && rm -f wrangler.toml.bak
  echo "Database maths-practice: $id"
else
  echo "Database already set up."
fi
W d1 execute maths-practice --remote --file=schema.sql --yes >/dev/null
echo "Tables ready."

say "3/6  Deploying the server"
echo "(If Cloudflare asks to register a workers.dev subdomain, say yes and pick any name, e.g. your name.)"
# `script` keeps the terminal interactive (for that question) while recording the output
log="$(mktemp)"
if [ -t 0 ]; then script -q "$log" npx --no-install wrangler deploy; else W deploy 2>&1 | tee "$log"; fi
URL="$(grep -oE 'https://[a-zA-Z0-9.-]+\.workers\.dev' "$log" | head -1)"
rm -f "$log"
[ -n "$URL" ] || { echo "Deployed, but couldn't find the address in the output above."; exit 1; }
echo "Server address: $URL"

say "4/6  Your admin login"
admins="$(W d1 execute maths-practice --remote --command "SELECT COUNT(*) AS n FROM users WHERE admin = 1" --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String(JSON.parse(s)[0].results[0].n))}catch{process.stdout.write("?")}})' || echo "?")"
if [ "$admins" != "0" ] && [[ " $* " != *" --new-admin "* ]]; then
  echo "You already have an admin login. (Run with --new-admin to add another or reset yours.)"
else
  echo "This is the login you use to make logins for other people."
  read -r -p "Your name (shown in the app): " ANAME
  ANAME="${ANAME:0:60}"
  while :; do
    read -r -p "Choose a username (lower case, e.g. iolo): " AUSER
    AUSER="$(printf '%s' "$AUSER" | tr '[:upper:]' '[:lower:]' | tr -d ' ')"
    [[ "$AUSER" =~ ^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$ ]] && break
    echo "3–32 letters, numbers, dots, dashes or underscores, please."
  done
  while :; do
    read -rs -p "Choose a password (8+ characters; nothing shows as you type): " P1; echo
    read -rs -p "Type it again: " P2; echo
    [ "$P1" = "$P2" ] && [ ${#P1} -ge 8 ] && break
    echo "They didn't match, or it's shorter than 8 characters — try again."
  done
  HASH="$(ADMIN_USER="$AUSER" ADMIN_PASSWORD="$P1" node scripts/admin-hash.mjs)"
  unset P1 P2
  NAME_SQL="$(printf '%s' "$ANAME" | sed "s/'/''/g")"
  [ -n "$NAME_SQL" ] || NAME_SQL="$AUSER"
  W d1 execute maths-practice --remote --yes --command "INSERT INTO users (username, name, pass, admin, must_change, disabled, created_at) VALUES ('$AUSER', '$NAME_SQL', '$HASH', 1, 0, 0, $(date +%s)000) ON CONFLICT(username) DO UPDATE SET pass = excluded.pass, name = excluded.name, admin = 1, disabled = 0, must_change = 0" >/dev/null
  echo "Admin login '$AUSER' ready."
fi

if [ "$SKIP_SECRETS" = 0 ]; then
  say "5/6  Built-in AI marking (optional, paid — most people skip this)"
  echo "The app's free 'Ask your AI app' button already sends work to Claude/ChatGPT on each person's own account."
  echo "Built-in AI instead marks inside the app, paid from an Anthropic API account (about 3–5p a marking)."
  echo "Paste an Anthropic API key to turn it on (nothing shows as you paste), or just press Return to skip."
  read -rs KEY; echo
  if [ -n "$KEY" ]; then
    case "$KEY" in sk-ant-*) ;; *) echo "That doesn't look like an Anthropic key (sk-ant-…). Run this script again to retry."; exit 1 ;; esac
    printf '%s' "$KEY" | W secret put ANTHROPIC_API_KEY >/dev/null
    unset KEY
    echo "API key saved (only on Cloudflare)."
    echo
    echo "Choose an access code: the app asks for it before using built-in AI, so only people you tell can spend your credit."
    echo "Type one (8+ characters) and press Return, or just press Return to have one made for you."
    read -r CODE
    if [ -z "$CODE" ]; then
      CODE="$(node -e 'const a="abcdefghjkmnpqrstuvwxyz23456789";const b=require("crypto").randomBytes(12);let s="";for(const x of b)s+=a[x%a.length];console.log(s.match(/.{4}/g).join("-"))')"
    fi
    [ ${#CODE} -ge 8 ] || { echo "Too short — run this script again."; exit 1; }
    printf '%s' "$CODE" | W secret put ACCESS_CODE >/dev/null
    echo "Access code saved."
  else
    echo "Skipped."
  fi
fi

say "6/6  Connecting the app"
health="$(curl -fsS "$URL/health" 2>/dev/null || true)"
echo "Server says: ${health:-no answer yet (it can take a minute to appear)}"
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh variable set API_URL --repo "$REPO" --body "$URL"
  gh workflow run deploy.yml --repo "$REPO" --ref main
  echo "The website is rebuilding with the server address (about 10 minutes)."
else
  echo "GitHub CLI isn't signed in: set the repository variable API_URL to $URL and re-run the deploy workflow."
fi

say "Done."
echo "Server:        $URL"
[ -n "${AUSER:-}" ] && echo "Admin login:   $AUSER (with the password you chose)"
[ -n "${CODE:-}" ] && echo "AI access code: $CODE    ← for Settings → Built-in AI on each device"
echo "Next: in about 10 minutes open the app → Settings → Sign in, then 'Manage logins' to make logins for people."
