#!/bin/bash
# Double-click to back up everyone's Maths Practice work to this Mac every night at 2:30am, into
# "Maths Practice backups" in your home folder (the latest 30 are kept). If the Mac is asleep then,
# it runs when it next wakes. "Turn off nightly backups.command" stops it.
#
# macOS doesn't let background jobs read the Desktop, so the backup program is copied to
# ~/Library/Application Support/MathsPracticeBackup, and the Supabase secret key is kept in your
# login keychain (never in a file).
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:$PATH"
LABEL="com.mathspractice.backup"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
APP="$HOME/Library/Application Support/MathsPracticeBackup"
OUT="$HOME/Maths Practice backups"

REF="$(npx --no-install supabase projects list -o json 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{process.stdout.write((JSON.parse(s).find(p=>p.name==='maths-practice')||{}).id||'')}catch{}})")"
[ -n "$REF" ] || { echo "Not signed in to Supabase — run supabase/setup.sh first."; exit 1; }
SECRET="$(npx --no-install supabase projects api-keys --project-ref "$REF" --reveal -o json 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const x=JSON.parse(s);process.stdout.write(((x.find(k=>String(k.api_key).startsWith('sb_secret_'))||x.find(k=>k.name==='service_role'))||{}).api_key||'')})")"
[ -n "$SECRET" ] || { echo "Couldn't read the project's secret key."; exit 1; }
security add-generic-password -U -a maths-practice -s maths-practice-backup -l "Maths Practice nightly backup" -w "$SECRET"
unset SECRET

mkdir -p "$APP" "$OUT" "$HOME/Library/LaunchAgents"
chmod 700 "$APP" "$OUT"
cp supabase/scripts/backup.mjs "$APP/backup.mjs"
cat > "$APP/nightly.sh" <<NIGHTLY
#!/bin/bash
set -euo pipefail
export PATH="\$HOME/.local/bin:/usr/bin:/bin"
cd "$OUT"
export SUPABASE_URL="https://$REF.supabase.co" BACKUP_DIR="$OUT"
SECRET_KEY="\$(security find-generic-password -a maths-practice -s maths-practice-backup -w)" node "$APP/backup.mjs"
# keep the latest 30 backups
ls -1d "$OUT"/20*/ 2>/dev/null | sort -r | tail -n +31 | while read -r old; do rm -rf "\$old"; done || true
NIGHTLY
chmod 700 "$APP/nightly.sh"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$APP/nightly.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>2</integer><key>Minute</key><integer>30</integer></dict>
  <key>StandardOutPath</key><string>$OUT/backup.log</string>
  <key>StandardErrorPath</key><string>$OUT/backup.log</string>
</dict>
</plist>
PLIST
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Nightly backups are on: every night at 2:30am, into \"$OUT\" (the latest 30 are kept)."
echo "To stop them, double-click \"Turn off nightly backups.command\"."
if [ -t 0 ]; then read -r -p "Press Return to close this window. " _; fi
