#!/usr/bin/env bash
# Guard: no Google Analytics in the archive. Until 2026-10-23 every page loaded
# google-analytics.com/analytics.js for an account nobody reads; the owner decided an archive should not
# report its visitors to a third party, and on 2026-10-25 uninstalled the module on production. Since the
# re-frozen baseline (2026-10-25) the original has no Analytics either, so this normally changes nothing.
# If the module is enabled again, it is disabled here; if any sample page still refers to Analytics, fail.
# Expect: status 0 -> 0, 0 references.
source "$(dirname "$0")/../lib.sh"
guard_prep
status_of() { in_prep ddev mysql -N -e "SELECT COALESCE(MAX(status), 0) FROM system WHERE type = 'module' AND name = 'googleanalytics'"; }
before=$(status_of)
if [ "$before" = 1 ]; then
  out=$(in_prep ddev exec drush -y dis googleanalytics 2>&1) || { echo "$out" >&2; exit 1; }
  prep_cc
fi
after=$(status_of)
# A sample: the home page, a node page, a listing.
refs=0
for p in / node/4123 blog; do refs=$((refs + $(prep_get "$p" | grep -c 'google-analytics\|googletagmanager' || true))); done
echo "disable-google-analytics: module status $before -> $after; $refs reference(s) on 3 sample pages (expect 0 -> 0, 0)"
[ "$refs" = 0 ] || { echo "disable-google-analytics: Analytics is still on prep's pages" >&2; exit 1; }
