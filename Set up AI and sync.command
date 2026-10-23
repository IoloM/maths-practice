#!/bin/bash
# Double-click to set up (or re-deploy) the Maths Practice server for sync and AI marking.
cd "$(dirname "$0")/server" && ./setup.sh
echo
read -r -p "Press Return to close this window. " _
