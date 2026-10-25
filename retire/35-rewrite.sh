#!/usr/bin/env bash
# Make the crawled copy self-contained: rewrite every reference to the prepared site and to the
# site's own domain, by the rules in test/playwright/rewrite-rules.json. Prints a count per decision.
source "$(dirname "$0")/lib.sh"
cd "$TESTS"
node kit/scripts/rewrite-static.mjs --dir "$STATIC_DOCROOT" --root . --rules rewrite-rules.json
