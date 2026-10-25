#!/bin/bash
# Double-click to stop the nightly backups that "Turn on nightly backups.command" set up.
LABEL="com.mathspractice.backup"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
rm -f "$HOME/Library/LaunchAgents/$LABEL.plist"
rm -rf "$HOME/Library/Application Support/MathsPracticeBackup"
security delete-generic-password -a maths-practice -s maths-practice-backup >/dev/null 2>&1 || true
echo "Nightly backups are off. Backups already made are still in \"$HOME/Maths Practice backups\"."
if [ -t 0 ]; then read -r -p "Press Return to close this window. " _; fi
