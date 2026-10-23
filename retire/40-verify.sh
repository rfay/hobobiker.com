#!/usr/bin/env bash
# Check the static project against the frozen baseline from the ORIGINAL, with the static-target
# decisions in expected-differences.json applied (MIGRATION_TARGET=static). HTTP tiers only; the
# browser tiers (visible, layout) take minutes more: GREP='visible:|layout:' ./40-verify.sh
source "$(dirname "$0")/lib.sh"
GREP="${GREP:-semantic:|access:|asset:|static:|baseline:}"
REPORT="${REPORT:-tmp/static-run.json}"   # relative to test/playwright
require_running "$ORIGINAL" "$STATIC"
cd "$ORIGINAL"
status=0
ddev exec -d /var/www/html/test/playwright \
  "PLAYWRIGHT_JSON_OUTPUT_NAME=$REPORT MIGRATION_TARGET=static TEST_BASE_URL=$STATIC_URL npx playwright test --grep '$GREP' --reporter=dot,json" \
  >/dev/null || status=$?
node "$TESTS/scripts/summarize-run.mjs" "$TESTS/$REPORT"
echo "verify: report in test/playwright/$REPORT"
exit $status
