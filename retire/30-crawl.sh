#!/usr/bin/env bash
# Crawl the PREPARED copy into the static project's docroot, from the host. The page list comes from
# the frozen baseline. The mirror script empties public/ first and refuses a directory that looks like
# a project root.
source "$(dirname "$0")/lib.sh"
guard_prep
# Browsing PREP through its public Coder URL caches rendered output with that hostname in it, and the
# crawl would copy it (seen 2026-10-23: 18 references on 6 pages; the rewrite made them relative). Clear
# the caches right before crawling so the crawl's input does not depend on who browsed PREP meanwhile.
prep_cc
cd "$TESTS"
mkdir -p "$STATIC_PUBLIC"
# Keep the full output so a failure shows its real error, not just the last line.
# --one-hop: Part 1 bounded discovery of tripinfo_item pages (discover.noFollow), so captured pages link to
# day pages and sorted listings the baseline never captured; fetch those too, or their links are unwrapped.
out=$(node kit/scripts/mirror-static.mjs --root . --from "$PREP_URL" --out "$STATIC_PUBLIC" --ca "$CA" --one-hop 2>&1) || { echo "$out" | tail -25 >&2; exit 1; }
echo "$out" | grep -E '^(Mirrored|One hop|Restored)'
echo "crawl: $(find "$STATIC_PUBLIC" -name '*.html' | wc -l) HTML page(s) and $(find "$STATIC_PUBLIC" -type f ! -name '*.html' | wc -l) other file(s) in $STATIC_PUBLIC"
