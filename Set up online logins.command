#!/bin/bash
# Double-click to set up (or update) online logins for Maths Practice on Supabase.
cd "$(dirname "$0")" && ./supabase/setup.sh
echo
read -r -p "Press Return to close this window. " _
