#!/usr/bin/env bash
# Run every preparation script in prep/, in order, against PREP. Each prints a count of what it changed.
source "$(dirname "$0")/lib.sh"
guard_prep
shopt -s nullglob
scripts=("$(dirname "$0")"/prep/[0-9]*.sh)
for s in "${scripts[@]}"; do bash "$s"; done
# Drupal 6 caches rendered pages and filtered bodies; clear them so the crawl sees the prepared site.
prep_cc
echo "prepare: ${#scripts[@]} script(s) run"
