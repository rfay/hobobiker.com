#!/usr/bin/env bash
# Files GitHub Pages needs in the published folder, which the crawl empties on every run:
#   CNAME      the custom domain (static.hobobiker.com, owner's setup, 2026-10-25). Pages deployed from a
#              branch read it from the folder; saving the domain in the settings page commits this file.
#   .nojekyll  serve the files as they are, without running Jekyll over the archive.
# The repository is rfay/hobobiker-static; Pages publishes main:/docs, which is this docroot.
source "$(dirname "$0")/lib.sh"
cname="${STATIC_CNAME:-static.hobobiker.com}"
printf '%s\n' "$cname" > "$STATIC_DOCROOT/CNAME"
: > "$STATIC_DOCROOT/.nojekyll"
echo "publishing-files: CNAME ($cname) and .nojekyll written to $STATIC_DOCROOT"
