#!/usr/bin/env bash
# The whole retirement pipeline, from a pristine restore:
#   restore PREP -> prepare PREP (scripts) -> crawl PREP into STATIC -> rewrite -> verify STATIC
# against the frozen baseline. Re-runnable: every step starts from the previous one's clean output.
#   retire/run.sh               everything, every tier
#   HTTP_ONLY=1 retire/run.sh   skip the browser tiers (visible, layout)
set -euo pipefail
cd "$(dirname "$0")"
source ./lib.sh
require_running "$ORIGINAL" "$PREP" "$STATIC"
require_patched_php "$ORIGINAL" "$PREP" "$STATIC"
# The static project serves the crawl with the kit's nginx rule; a stale copy fails checks for no visible reason.
rule="$TESTS/kit/templates/static-urls.nginx.conf"
cmp -s "$rule" "$STATIC/.ddev/nginx/static-urls.nginx.conf" || {
  echo "The static project's nginx rule differs from the vendored kit's. Update it with:" >&2
  echo "  cp $rule $STATIC/.ddev/nginx/ && (cd $STATIC && ddev exec 'nginx -t && nginx -s reload')" >&2
  exit 1
}
start=$SECONDS
./10-restore-prep.sh
./20-prepare.sh
./30-crawl.sh
./35-rewrite.sh
# Every tier by default (about 10 minutes); HTTP_ONLY=1 skips the browser tiers (about 1 minute).
if [ "${HTTP_ONLY:-0}" = 1 ]; then ./40-verify.sh; else GREP='semantic:|access:|asset:|static:|baseline:|visible:|layout:' ./40-verify.sh; fi
echo "pipeline: $((SECONDS - start)) s"
