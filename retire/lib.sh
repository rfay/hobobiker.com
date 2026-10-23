# Shared settings for the retirement pipeline. Sourced by the other scripts.
#
# Three sibling DDEV projects (see test/playwright/kit/docs/retirement-approach.md and AGENTS.md):
#   ORIGINAL  hobobiker-copy     the reference; this pipeline never modifies it
#   PREP      hobobiker-prep     restored from the pristine dump, then prepared by scripts
#   STATIC    hobobiker-static   the crawled HTML of PREP, served from public/
set -euo pipefail

HOBO="${HOBO:-$HOME/workspace/hobo}"
ORIGINAL="${ORIGINAL:-$HOBO/hobobiker-copy}"
PREP="${PREP:-$HOBO/hobobiker-prep}"
STATIC="${STATIC:-$HOBO/hobobiker-static}"
STATIC_PUBLIC="${STATIC_PUBLIC:-$STATIC/public}"          # the static project's docroot (a subdirectory)
PREP_URL="${PREP_URL:-https://hobobiker-prep.ddev.site}"
STATIC_URL="${STATIC_URL:-https://hobobiker-static.ddev.site}"
TESTS="$ORIGINAL/test/playwright"
CA="$(mkcert -CAROOT 2>/dev/null)/rootCA.pem"

# Safety: every destructive step acts on $PREP (and $STATIC_PUBLIC) only. Refuse to run if PREP is the
# original, or anything not named like a prep copy. restore-pristine.sh has no guard of its own.
guard_prep() {
  [ "$(cd "$PREP" && pwd)" != "$(cd "$ORIGINAL" && pwd)" ] || { echo "Refusing: PREP is the original project." >&2; exit 2; }
  case "$(basename "$PREP")" in *prep*) ;; *) echo "Refusing: '$PREP' does not look like a prep copy (name must contain 'prep')." >&2; exit 2;; esac
}

# Run a command in PREP's project (ddev acts on the project of the current directory).
in_prep() { (cd "$PREP" && "$@"); }

# Clear PREP's Drupal caches (rendered pages, filtered bodies, panels). drush 5.9 on PHP 7.3 prints
# pages of deprecation warnings; show them only if the clear fails.
prep_cc() {
  local out
  out=$(in_prep ddev exec drush cc all 2>&1) || { echo "$out" >&2; exit 1; }
}

# Fetch a page of PREP as an anonymous visitor, from the host.
prep_get() { curl -sS --cacert "$CA" "$PREP_URL/${1#/}"; }

# Fail fast and clearly if a project is not running. Without this, a stopped static project makes every
# test fail to connect and the run takes minutes to report thousands of failures.
require_running() {
  local d status
  for d in "$@"; do
    status=$(cd "$d" && ddev describe -j 2>/dev/null | jq -r '.raw.status // "unknown"')
    [ "$status" = running ] || {
      echo "Project $(basename "$d") is '$status', not running. Start it with: (cd $d && ddev start)" >&2
      exit 1
    }
  done
}

# These sites have public Coder URLs: their PHP must carry the PHP2Shell fix (built Oct 21 2026 or later).
require_patched_php() {
  local d built
  for d in "$@"; do
    built=$(cd "$d" && ddev php -v 2>/dev/null | sed -n 's/.*(built: \([A-Za-z]* *[0-9]* [0-9]*\).*/\1/p' | head -1)
    if [ -z "$built" ] || [ "$(date -d "$built" +%Y%m%d)" -lt 20261021 ]; then
      echo "Project $(basename "$d"): PHP built '${built:-unknown}', older than the PHP2Shell fix (Oct 21 2026)." >&2
      exit 1
    fi
  done
}
