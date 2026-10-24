#!/bin/bash
# Double-click to copy everyone's Maths Practice work from Supabase to this computer (the backups folder).
cd "$(dirname "$0")" && ./supabase/backup.sh
echo
read -r -p "Press Return to close this window. " _
