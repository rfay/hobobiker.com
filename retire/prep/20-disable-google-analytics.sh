#!/usr/bin/env bash
# Disable Google Analytics: every page loads google-analytics.com/analytics.js for an account nobody
# reads, and an archive should not report its visitors to a third party (owner's decision, 2026-10-23).
# Declared in test/playwright/expected-differences.json. Expect: status 1 -> 0, 0 references left.
source "$(dirname "$0")/../lib.sh"
guard_prep
status_of() { in_prep ddev mysql -N -e "SELECT status FROM system WHERE type = 'module' AND name = 'googleanalytics'"; }
before=$(status_of)
out=$(in_prep ddev exec drush -y dis googleanalytics 2>&1) || { echo "$out" >&2; exit 1; }
after=$(status_of)
prep_cc
# A sample: the home page, a node page, a listing.
refs=0
for p in / node/4123 blog; do refs=$((refs + $(prep_get "$p" | grep -c 'google-analytics' || true))); done
echo "disable-google-analytics: module status $before -> $after; $refs reference(s) on 3 sample pages (expect 1 -> 0, 0)"
