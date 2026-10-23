#!/usr/bin/env bash
# One-step setup (and re-deploy) of the Maths Practice server: a Cloudflare Worker with a D1 database.
#   1. signs in to Cloudflare (opens the browser the first time)
#   2. creates the database and its tables (once)
#   3. deploys the Worker
#   4. asks for the Anthropic API key and an access code (hidden; stored as Cloudflare secrets)
#   5. tells the app where the server is (GitHub repository variable API_URL) and rebuilds the site
# Safe to run again: existing pieces are kept. Run with --skip-secrets to only re-deploy.
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:$PATH"
REPO="IoloM/maths-practice"
SKIP_SECRETS=0
[ "${1:-}" = "--skip-secrets" ] && SKIP_SECRETS=1

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
W() { npx --no-install wrangler "$@"; }

command -v node >/dev/null || { echo "Node.js is missing (expected in ~/.local/bin)."; exit 1; }
[ -d node_modules ] || { say "Installing the server's tools…"; npm ci --no-audit --no-fund; }

say "1/5  Cloudflare sign-in"
if ! W whoami 2>&1 | grep -q "You are logged in"; then
  echo "A Cloudflare page will open in your browser: sign in (or sign up, free) and click Allow."
  W login
fi
W whoami 2>&1 | grep -E "logged in|Account Name|│" | head -6 || true

say "2/5  Database"
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

say "3/5  Deploying the server"
echo "(If Cloudflare asks to register a workers.dev subdomain, say yes and pick any name, e.g. your name.)"
# `script` keeps the terminal interactive (for that question) while recording the output
log="$(mktemp)"
if [ -t 0 ]; then script -q "$log" npx --no-install wrangler deploy; else W deploy 2>&1 | tee "$log"; fi
URL="$(grep -oE 'https://[a-zA-Z0-9.-]+\.workers\.dev' "$log" | head -1)"
rm -f "$log"
[ -n "$URL" ] || { echo "Deployed, but couldn't find the address in the output above."; exit 1; }
echo "Server address: $URL"

if [ "$SKIP_SECRETS" = 0 ]; then
  say "4/5  AI key and access code"
  echo "Paste your Anthropic API key (it starts sk-ant-; nothing shows as you paste), then press Return."
  echo "Press Return on its own to skip AI for now — sync between devices still works."
  read -rs KEY; echo
  if [ -n "$KEY" ]; then
    case "$KEY" in sk-ant-*) ;; *) echo "That doesn't look like an Anthropic key (sk-ant-…). Run this script again to retry."; exit 1 ;; esac
    printf '%s' "$KEY" | W secret put ANTHROPIC_API_KEY >/dev/null
    unset KEY
    echo "API key saved (only on Cloudflare)."
    echo
    echo "Choose an access code: the app asks for it before using AI, so only you can spend your credit."
    echo "Type one (8+ characters) and press Return, or just press Return to have one made for you."
    read -r CODE
    if [ -z "$CODE" ]; then
      CODE="$(node -e 'const a="abcdefghjkmnpqrstuvwxyz23456789";const b=require("crypto").randomBytes(12);let s="";for(const x of b)s+=a[x%a.length];console.log(s.match(/.{4}/g).join("-"))')"
    fi
    [ ${#CODE} -ge 8 ] || { echo "Too short — run this script again."; exit 1; }
    printf '%s' "$CODE" | W secret put ACCESS_CODE >/dev/null
    echo "Access code saved."
  else
    echo "Skipped: AI stays off until you run this again with a key."
  fi
fi

say "5/5  Connecting the app"
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
[ -n "${CODE:-}" ] && echo "Access code:   $CODE    ← write this down; you type it into Settings on each device"
echo "Next: open the app → Settings → 'Handwriting and AI marking' → enter the access code → Save and test."
echo "      Then 'Sync between devices' → Start syncing, and type that sync code into your other devices."
