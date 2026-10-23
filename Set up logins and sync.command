#!/bin/bash
# Double-click to set up (or re-deploy) the Maths Practice server: logins, saved progress and sync.
cd "$(dirname "$0")/server" && ./setup.sh
echo
read -r -p "Press Return to close this window. " _
